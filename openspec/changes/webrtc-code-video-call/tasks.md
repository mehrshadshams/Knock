## 1. Project Setup

- [x] 1.1 Initialize Node.js project with `package.json` and install `ws` WebSocket library
- [x] 1.2 Create directory structure: `public/` for static frontend files, `server.js` for the signaling server
- [x] 1.3 Configure `server.js` to serve static files from `public/` and upgrade HTTP connections to WebSocket

## 2. Signaling Server

- [x] 2.1 Implement in-memory session store: `Map<code, { peers: WebSocket[] }>` with TTL cleanup (10-minute inactivity expiry)
- [x] 2.2 Implement 6-character alphanumeric code generation with uniqueness check against active sessions
- [x] 2.3 Handle `join` message: validate code, enforce 2-participant limit, associate WebSocket with session, broadcast `peer-joined` to offerer when second peer connects
- [x] 2.4 Relay `offer`, `answer`, and `ice-candidate` messages to the other peer in the same session
- [x] 2.5 Handle WebSocket `close` event: send `peer-left` to remaining peer, remove session if empty
- [x] 2.6 Send `error` messages for invalid codes, full sessions, and malformed messages

## 3. Frontend — Home Screen

- [x] 3.1 Create `public/index.html` with two actions: "Start a Call" and a code entry form with a "Join" button
- [x] 3.2 Create `public/style.css` with responsive layout for home screen and call screen
- [x] 3.3 Implement "Start a Call": request a new session code from the server via WebSocket `join` (server generates and returns the code), display the code, and add a copy-to-clipboard button
- [x] 3.4 Implement "Join": send a `join` message with the entered code; show error messages returned by the server

## 4. Frontend — WebRTC Connection

- [x] 4.1 Create `public/main.js`; implement `getUserMedia({ video: true, audio: true })` with permission-denied error handling
- [x] 4.2 Display local video stream in a `<video>` element (muted, autoplay)
- [x] 4.3 Instantiate `RTCPeerConnection` with STUN server (`stun:stun.l.google.com:19302`) after media access is granted
- [x] 4.4 Add local media tracks to the peer connection
- [x] 4.5 Implement offerer flow: on `peer-joined`, create SDP offer, set as local description, send via signaling server
- [x] 4.6 Implement answerer flow: on receiving `offer`, set remote description, create SDP answer, set as local description, send via signaling server
- [x] 4.7 Handle incoming `answer`: set as remote description on the offerer side
- [x] 4.8 Implement ICE candidate exchange: on `icecandidate` event send to server; on receiving `ice-candidate` add to peer connection
- [x] 4.9 Display remote stream in a second `<video>` element when `ontrack` fires

## 5. Frontend — Call Controls

- [x] 5.1 Add mute/unmute button: toggle the `enabled` property of the audio track and update button label/icon
- [x] 5.2 Add camera on/off button: toggle the `enabled` property of the video track and update button label/icon
- [x] 5.3 Add "End Call" button: close `RTCPeerConnection`, close WebSocket, clear video elements, navigate back to home screen
- [x] 5.4 Handle `peer-left` signaling message: display "Call ended" notification and return user to home screen
- [x] 5.5 Ensure all call controls are visible and interactive throughout the call (no auto-hide)

## 6. Testing & Validation

- [x] 6.1 Test code generation: verify codes are 6 alphanumeric characters and unique across concurrent sessions
- [x] 6.2 Test invalid/full session error messages are displayed correctly in the UI
- [x] 6.3 Test successful 1:1 call in two browser tabs/windows on the same machine
- [x] 6.4 Test mute, camera toggle, and hang-up controls end-to-end
- [x] 6.5 Test session expiry: confirm abandoned sessions are cleaned up after 10 minutes
- [x] 6.6 Test `peer-left` handling: confirm the remaining participant is notified when the other hangs up
