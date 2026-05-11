## Why

People need a simple, frictionless way to video call one another without accounts or app installs. By generating a short connection code, two users can establish a secure 1:1 WebRTC video session directly in the browser.

## What Changes

- Introduce a web application that generates a unique session code for a caller
- Allow a second user to join by entering that code
- Establish a peer-to-peer WebRTC video/audio connection between the two users
- Provide basic in-call controls (mute, camera toggle, hang up)
- Use a lightweight signaling server to exchange WebRTC offer/answer/ICE candidates

## Capabilities

### New Capabilities

- `session-code`: Generate and display a unique short code that identifies a video call session; allow a peer to enter the code to join
- `webrtc-connection`: Establish a 1:1 peer-to-peer WebRTC video and audio connection between two participants using the session code for signaling coordination
- `signaling`: Real-time signaling channel (WebSocket-based) that relays SDP offer/answer and ICE candidates between peers
- `call-controls`: In-call UI controls allowing each participant to mute/unmute audio, enable/disable video, and end the call

### Modified Capabilities

## Impact

- New frontend application (HTML/CSS/JS or lightweight framework)
- New signaling server (Node.js WebSocket server or equivalent)
- Dependency on browser WebRTC APIs (`RTCPeerConnection`, `getUserMedia`)
- STUN server required for NAT traversal (public STUN servers acceptable for MVP)
- No database required for MVP (sessions are ephemeral, held in memory on the signaling server)
