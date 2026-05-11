## ADDED Requirements

### Requirement: Establish peer-to-peer video and audio connection
The system SHALL establish a direct WebRTC peer-to-peer connection carrying video and audio streams between exactly two participants in a session.

#### Scenario: Successful connection
- **WHEN** both participants have joined the same session and exchanged SDP and ICE candidates
- **THEN** each participant SHALL see the other's live video and hear the other's audio

#### Scenario: Offerer creates offer
- **WHEN** the session code generator (offerer) detects the second peer has joined
- **THEN** the offerer SHALL create an SDP offer and send it to the signaling server

#### Scenario: Answerer creates answer
- **WHEN** the answerer receives an SDP offer via the signaling server
- **THEN** the answerer SHALL create an SDP answer and send it back via the signaling server

#### Scenario: ICE candidate exchange
- **WHEN** either peer generates an ICE candidate
- **THEN** that candidate SHALL be sent to the other peer via the signaling server

### Requirement: Request camera and microphone access
The system SHALL request access to the user's camera and microphone before initiating or joining a call.

#### Scenario: User grants permissions
- **WHEN** the browser prompts for camera and microphone access and the user grants it
- **THEN** the local video preview SHALL appear and the WebRTC connection setup SHALL proceed

#### Scenario: User denies permissions
- **WHEN** the user denies camera or microphone access
- **THEN** the system SHALL display an error: "Camera and microphone access are required to make a call." and not proceed

### Requirement: Display local and remote video
The system SHALL display the local user's video preview and the remote participant's video stream simultaneously during an active call.

#### Scenario: Local preview shown
- **WHEN** the user's camera access is granted
- **THEN** a local video preview SHALL be displayed (muted, to prevent audio feedback)

#### Scenario: Remote video shown
- **WHEN** the WebRTC connection is established and the remote stream is received
- **THEN** the remote participant's video SHALL be displayed in the primary video area

### Requirement: Use STUN for NAT traversal
The system SHALL configure the RTCPeerConnection with at least one public STUN server to support NAT traversal.

#### Scenario: STUN server configured
- **WHEN** an RTCPeerConnection is created
- **THEN** it SHALL include `stun:stun.l.google.com:19302` (or equivalent) in its ICE server configuration
