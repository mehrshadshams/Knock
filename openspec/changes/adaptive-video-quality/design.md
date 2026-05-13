## Context

Knock is a 1:1 WebRTC video call app with a Node.js signaling server and a vanilla-JS browser client. Currently the client calls `getUserMedia()` with default constraints and attaches the resulting stream to an `RTCPeerConnection` without configuring sender encodings, so the encoder produces whatever the camera and browser default to. On constrained connections this causes freezes and audio glitches because video monopolizes the available bandwidth.

WebRTC supports per-sender encoding parameters via `RTCRtpSender.setParameters()` (max bitrate, max framerate, `scaleResolutionDownBy`) which can be tuned at runtime without SDP renegotiation. `RTCPeerConnection.getStats()` exposes outbound and inbound stats including `roundTripTime`, `packetsLost`, `bytesSent`, and `availableOutgoingBitrate`.

## Goals / Non-Goals

**Goals:**
- Keep calls usable (audio intelligible, video low-fps but flowing) on connections as poor as ~150 kbps uplink.
- Adapt automatically by default; let advanced users force a tier manually.
- No server changes; no SDP renegotiation in the steady state.
- Provide visible feedback so users understand why their video looks lower-quality.

**Non-Goals:**
- Simulcast / SVC layered encoding (single-encoding adaptation only).
- Bandwidth probing beyond what `getStats()` already exposes.
- Audio bitrate adaptation (Opus already adapts; out of scope for v1).
- Per-receiver remote stream quality requests (the receiver cannot directly throttle the sender beyond what setParameters does).

## Decisions

### Decision 1: Quality tiers
Three tiers with concrete encoding targets, plus an Auto mode:

| Tier   | Max resolution | scaleResolutionDownBy | maxBitrate | maxFramerate |
|--------|---------------|-----------------------|------------|--------------|
| High   | 720p          | 1                     | 1_500_000  | 30           |
| Medium | 480p          | 1.5 (from 720p source)| 600_000    | 24           |
| Low    | 240p          | 3 (from 720p source)  | 200_000    | 15           |

`getUserMedia()` is requested at an "ideal" of 1280×720 so downscale ratios are well-defined. If the camera can only provide a smaller resolution, `scaleResolutionDownBy` still applies and the floor of 240p is approximate.

**Rationale**: Three tiers give meaningful UX choices without overwhelming users. 240p / 200 kbps is a well-known floor that keeps calls intelligible.

### Decision 2: Auto-adapt classifier
A polling loop runs `getStats()` every 3 seconds. From the outbound-rtp report and remote-inbound-rtp report it computes:
- `rtt` (s) from `remote-inbound-rtp.roundTripTime`
- `lossRate` from delta of `packetsLost` over delta of `packetsSent`
- `availableOutBps` from `candidate-pair.availableOutgoingBitrate` when present

Classification (use the worst-of-three):
- **Good**: rtt < 0.2s AND lossRate < 0.02 AND availableOutBps >= 800_000 (or unknown)
- **Fair**: rtt < 0.4s AND lossRate < 0.07 AND availableOutBps >= 300_000
- **Poor**: anything worse

Tier mapping: Good → High, Fair → Medium, Poor → Low.

To avoid oscillation, downgrade is immediate but upgrade requires the better classification to hold for **two consecutive samples** (~6 s).

**Rationale**: Hysteresis prevents flapping. Worst-of-three is conservative and matches user perception (any one bad metric ruins the call).

### Decision 3: Apply changes via setParameters, no renegotiation
On tier change, fetch the current `parameters` object from the video sender, mutate `encodings[0].maxBitrate`, `maxFramerate`, and `scaleResolutionDownBy`, then call `setParameters()`. This is a runtime change and does not require new SDP exchange.

**Alternative considered**: Replacing the track with a new `getUserMedia` stream at lower resolution. Rejected — heavier, requires renegotiation in some browsers, and is unnecessary for visible quality drops.

### Decision 4: Manual override semantics
The selector has options: **Auto**, **High**, **Medium**, **Low**. When set to a manual tier, the auto-adapter is suspended for the duration of the call and the chosen tier is applied immediately. Switching back to Auto re-enables polling and re-classifies on the next sample. Selection is per-call (not persisted) for v1.

### Decision 5: Quality indicator UI
A small badge next to the call controls displays one of:
- ● Good (green)
- ● Fair (amber)
- ● Poor (red)

Tooltip shows the most recent rtt / loss% / bitrate values. Updated on each poll regardless of Auto/Manual.

## Risks / Trade-offs

- **getStats() field availability varies across browsers** → Mitigation: feature-detect each metric; if `availableOutgoingBitrate` is missing, fall back to rtt+loss only and treat as "unknown bandwidth".
- **Tier oscillation on borderline connections** → Mitigation: 2-sample hysteresis on upgrades; immediate downgrade.
- **Camera that cannot deliver 720p** → Mitigation: request `ideal: 1280x720`; if the source is smaller, downscale ratios still produce smaller resolutions and bitrate caps still apply.
- **User confusion about why video looks low-res** → Mitigation: visible indicator with tooltip showing measured metrics.
- **`setParameters` rejection in some older browsers** → Mitigation: wrap in try/catch and log; UI still updates so users see the intent.

## Migration Plan

- Additive feature; no migration required.
- Rollback: remove the polling loop and revert the call UI to its prior controls.

## Open Questions

- Should the manual selection persist in `localStorage` across calls? (v1: no — keeps things predictable.)
- Should the quality indicator also reflect *received* stream quality, not just outgoing? (v1: outgoing only; revisit later.)
