## ADDED Requirements

### Requirement: Generate session code
The system SHALL generate a unique 6-character alphanumeric session code when a user requests a new call session.

#### Scenario: Code is generated on demand
- **WHEN** a user opens the home page and clicks "Start a Call"
- **THEN** the system generates a unique 6-character alphanumeric code and displays it to the user

#### Scenario: Code is unique
- **WHEN** a new code is generated
- **THEN** the code SHALL NOT match any currently active session code on the server

#### Scenario: Code is easy to share
- **WHEN** the code is displayed
- **THEN** the UI SHALL provide a one-click copy-to-clipboard action alongside the code

### Requirement: Join session by code
The system SHALL allow a second user to enter an existing session code to join the corresponding call.

#### Scenario: Valid code entry
- **WHEN** a user enters a valid, active session code and clicks "Join"
- **THEN** the system SHALL route the user into the video call for that session

#### Scenario: Invalid code entry
- **WHEN** a user enters a code that does not match any active session
- **THEN** the system SHALL display an error message: "Session not found. Check the code and try again."

#### Scenario: Session already full
- **WHEN** a user enters a code for a session that already has two participants
- **THEN** the system SHALL display an error message: "This session is already in progress."

### Requirement: Session expiry
The system SHALL automatically expire a session after 10 minutes of inactivity (no participants connected).

#### Scenario: Abandoned session cleanup
- **WHEN** a session has had no connected participants for 10 minutes
- **THEN** the server SHALL remove the session from memory and invalidate the code
