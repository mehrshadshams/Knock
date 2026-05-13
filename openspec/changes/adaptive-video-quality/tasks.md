## 1. Media constraints

- [x] 1.1 Update `getUserMedia` call in `public/main.js` to request `video: { width: { ideal: 1280 }, height: { ideal: 720 } }`
- [x] 1.2 Verify local preview still renders with the new constraints

## 2. Quality tier engine

- [x] 2.1 Define a `QUALITY_TIERS` constant in `public/main.js` with `high`, `medium`, `low` entries (maxBitrate, maxFramerate, scaleResolutionDownBy)
- [x] 2.2 Implement `applyTier(pc, tierName)` that locates the video `RTCRtpSender`, mutates `parameters.encodings[0]`, and calls `setParameters()`; wrap in try/catch and log on failure
- [x] 2.3 Track the currently active tier in module state and skip `setParameters` if unchanged

## 3. Stats polling & classifier

- [x] 3.1 Implement `sampleStats(pc)` returning `{ rtt, lossRate, availableOutBps }` from `pc.getStats()` (use outbound-rtp + remote-inbound-rtp + candidate-pair reports)
- [x] 3.2 Implement `classify(sample)` returning `'good' | 'fair' | 'poor'` per the threshold table in the spec; tolerate missing `availableOutBps`
- [x] 3.3 Implement a 3-second polling loop that runs while the call is active; clear it on `peer-left` / call end
- [x] 3.4 Implement hysteresis: immediate downgrade, 2-consecutive-sample requirement for upgrade

## 4. Manual override UI

- [x] 4.1 Add a `<select>` quality selector to `public/index.html` in the call controls bar with options Auto / High (720p) / Medium (480p) / Low (240p)
- [x] 4.2 Wire selector change handler: on manual selection, suspend the auto-adapter and call `applyTier`; on Auto, resume polling
- [x] 4.3 Default the selector to Auto on each call start

## 5. Quality indicator UI

- [x] 5.1 Add a quality indicator element (badge) to `public/index.html` next to the selector
- [x] 5.2 Update the indicator's text + class on each classification (`good` / `fair` / `poor`)
- [x] 5.3 Populate a tooltip (`title` attribute) with most recent RTT (ms), loss (%), and available outgoing bitrate (kbps) or "unknown"
- [x] 5.4 Add styles in `public/style.css` for green / amber / red states

## 6. Lifecycle integration

- [x] 6.1 Start the polling loop only after the WebRTC connection reaches the `connected` ICE state
- [x] 6.2 Stop the polling loop and reset state when the call ends, the peer leaves, or the user navigates away

## 7. Verification

- [ ] 7.1 Manually test: throttle to ~150 kbps in DevTools — verify Low tier engages and indicator shows Poor
- [ ] 7.2 Manually test: restore full bandwidth — verify upgrade requires ~6s and ends at High
- [ ] 7.3 Manually test: select Low manually — verify auto-adapt is suspended and stays at Low under good conditions
- [ ] 7.4 Manually test: switch back to Auto — verify polling resumes and tier reclassifies
- [ ] 7.5 Manually test in a browser missing `availableOutgoingBitrate` (or simulate by stubbing) — classifier still works on RTT + loss
