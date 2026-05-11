## ADDED Requirements

### Requirement: WebSocket signaling channel
The system SHALL provide a WebSocket server that acts as the signaling relay between two peers in the same session.

#### Scenario: Client connects to signaling server
- **WHEN** a user opens the application
- **THEN** the browser SHALL establish a WebSocket connection to the signaling server

#### Scenario: Peer registers with session code
- **WHEN** a WebSocket client sends a `join` message with a valid session code
- **THEN** the server SHALL associate that connection with the session identified by the code

#### Scenario: Server relays messages between peers
- **WHEN** one peer sends a signaling message (offer, answer, or ICE candidate) to the server
- **THEN** the server SHALL forward that message only to the other peer in the same session

### Requirement: Signaling message types
The signaling server SHALL support the following message types: `join`, `offer`, `answer`, `ice-candidate`, `peer-joined`, `peer-left`, `error`.

#### Scenario: join message
- **WHEN** a client sends `{ type: "join", code: "<session-code>" }`
- **THEN** the server SHALL add the client to the session and, if both peers are now present, broadcast `{ type: "peer-joined" }` to the offerer

#### Scenario: offer message
- **WHEN** the offerer sends `{ type: "offer", sdp: <RTCSessionDescription> }`
- **THEN** the server SHALL forward it to the answerer in the same session

#### Scenario: answer message
- **WHEN** the answerer sends `{ type: "answer", sdp: <RTCSessionDescription> }`
- **THEN** the server SHALL forward it to the offerer in the same session

#### Scenario: ice-candidate message
- **WHEN** either peer sends `{ type: "ice-candidate", candidate: <RTCIceCandidate> }`
- **THEN** the server SHALL forward it to the other peer in the same session

#### Scenario: peer-left message
- **WHEN** a peer disconnects (WebSocket closes)
- **THEN** the server SHALL send `{ type: "peer-left" }` to the remaining peer

#### Scenario: error message
- **WHEN** an invalid code or a full session is referenced
- **THEN** the server SHALL send `{ type: "error", message: "<reason>" }` to the requesting client

### Requirement: Session isolation
The signaling server SHALL ensure that messages from one session are never delivered to participants of a different session.

#### Scenario: Cross-session isolation
- **WHEN** two sessions are active simultaneously
- **THEN** a message sent in session A SHALL NOT be received by any participant in session B
