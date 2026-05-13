## Why

Users on slow or unstable networks currently experience freezes, audio dropouts, and high latency because the WebRTC connection always sends the camera's native resolution and bitrate. Adapting video quality dynamically — and offering a manual floor as low as 240p — keeps calls usable on poor connections instead of breaking them.

## What Changes

- Monitor connection quality during a call using `RTCPeerConnection.getStats()` (RTT, packet loss, available outgoing bitrate) and classify it into Good / Fair / Poor tiers.
- Automatically adapt the outgoing video sender's encoding parameters (max bitrate, max framerate, scale-resolution-down-by) to match the current tier.
- Add a manual quality selector in the call UI: **Auto** (default), **High (720p)**, **Medium (480p)**, **Low (240p)**.
- Display a small connection-quality indicator (Good / Fair / Poor) alongside the call controls.
- Apply quality changes via `RTCRtpSender.setParameters()` without renegotiation when possible.

## Capabilities

### New Capabilities
- `adaptive-video-quality`: Monitor connection stats and adjust outgoing video encoding (bitrate, framerate, resolution scale) automatically or per user selection, with a 240p floor and a visible quality indicator.

### Modified Capabilities
<!-- None: this is purely additive on top of the existing webrtc-connection capability. -->

## Impact

- **Client (`public/main.js`)**: New stats-polling loop, quality classifier, and `RTCRtpSender.setParameters()` calls; new UI wiring for the quality selector and indicator.
- **Client (`public/index.html`, `public/style.css`)**: New quality selector dropdown and status indicator in the call controls bar.
- **Server**: No changes required.
- **Spec surface**: New `adaptive-video-quality` capability spec; no deltas to existing specs.
