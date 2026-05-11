## ADDED Requirements

### Requirement: Mute and unmute audio
The system SHALL allow a participant to mute and unmute their own microphone during an active call without ending the call.

#### Scenario: Mute audio
- **WHEN** a participant clicks the mute button
- **THEN** the participant's outgoing audio track SHALL be disabled and the button SHALL reflect the muted state

#### Scenario: Unmute audio
- **WHEN** a participant clicks the unmute button while muted
- **THEN** the participant's outgoing audio track SHALL be re-enabled and the button SHALL reflect the unmuted state

### Requirement: Enable and disable camera
The system SHALL allow a participant to turn their camera on or off during an active call without ending the call.

#### Scenario: Disable camera
- **WHEN** a participant clicks the camera-off button
- **THEN** the participant's outgoing video track SHALL be disabled and the remote participant SHALL see a blank/placeholder video

#### Scenario: Enable camera
- **WHEN** a participant clicks the camera-on button while the camera is off
- **THEN** the participant's outgoing video track SHALL be re-enabled

### Requirement: End the call
The system SHALL allow a participant to hang up and end the call session.

#### Scenario: Participant hangs up
- **WHEN** a participant clicks the "End Call" button
- **THEN** the WebRTC connection SHALL be closed, the WebSocket SHALL be disconnected, and the user SHALL be returned to the home screen

#### Scenario: Remote peer hangs up
- **WHEN** the remote peer ends the call
- **THEN** the local participant SHALL see a notification that the call has ended and SHALL be returned to the home screen

### Requirement: Call control visibility
Call control buttons SHALL be visible at all times during an active call.

#### Scenario: Controls are always accessible
- **WHEN** a call is in progress
- **THEN** the mute, camera toggle, and end-call buttons SHALL be visible and interactive at all times
