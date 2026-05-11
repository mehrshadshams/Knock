## ADDED Requirements

### Requirement: Display version badge on page load

The application SHALL display a version badge showing the format `version:hash` at the top of the page when the HTML document loads. The badge SHALL be visible in all views and not obstruct core WebRTC functionality.

#### Scenario: Badge displays on initial page load
- **WHEN** user navigates to the application URL
- **THEN** a version badge is visible at the top of the page within 2 seconds of page load

#### Scenario: Badge persists across WebRTC session
- **WHEN** user starts a WebRTC call and video stream is active
- **THEN** the version badge remains visible and does not interfere with the call UI

### Requirement: Version populated from package.json

The application version displayed in the badge SHALL be read from the `version` field in `package.json`.

#### Scenario: Correct version appears in badge
- **WHEN** package.json contains version `"1.0.0"`
- **THEN** the badge displays `1.0.0:` (before the hash)

#### Scenario: Version updates when package.json is updated
- **WHEN** package.json version is bumped to `1.1.0` and the application is redeployed
- **THEN** the badge shows `1.1.0:` in the new deployment

### Requirement: Build hash populated from environment

The build hash displayed in the badge SHALL be sourced from the `BUILD_HASH` environment variable at runtime. If BUILD_HASH is not available, a sensible default SHALL be displayed.

#### Scenario: Hash from Docker image digest
- **WHEN** the application is deployed as a Docker container with BUILD_HASH set to image digest `sha256:89e5b2ce5e40f8cb86ea0be43b8f653f7...` (shortened to 12 chars)
- **THEN** the badge displays version:hash as `1.0.0:89e5b2ce5e40f` (or similar short form)

#### Scenario: Default hash when not provided
- **WHEN** BUILD_HASH environment variable is not set (local development)
- **THEN** the badge displays a default such as `1.0.0:dev` or `1.0.0:<local-git-sha>`

### Requirement: Badge styling and positioning

The version badge SHALL be styled to be unobtrusive and readable, using fixed positioning without blocking user interaction with the main application.

#### Scenario: Badge is fixed at top of viewport
- **WHEN** user scrolls the page or WebRTC content moves
- **THEN** the version badge remains fixed at the top and does not scroll out of view

#### Scenario: Badge uses monospace font for hash
- **WHEN** the version badge is rendered
- **THEN** the hash portion uses a monospace font (e.g., `Courier New`, `Monaco`) for readability

#### Scenario: Badge has low visual prominence
- **WHEN** the version badge is displayed
- **THEN** it uses a small font size (8-10px) and translucent styling (e.g., gray text or light background) to avoid distracting from core UI

### Requirement: Badge content format

The version badge SHALL display content in the exact format `<version>:<hash>` where version is from package.json and hash is from BUILD_HASH environment variable or default.

#### Scenario: Badge displays in correct format
- **WHEN** version is `1.0.0` and hash is `abc123def456`
- **THEN** the badge text reads exactly `1.0.0:abc123def456`

### Requirement: No core functionality impact

The version display feature SHALL not impact the WebRTC signaling, media streaming, or call control functionality.

#### Scenario: Call can be initiated with badge present
- **WHEN** the version badge is visible
- **THEN** user can still click "Start a Call" button and generate a session code

#### Scenario: Peer can join call with badge present
- **WHEN** a peer enters a valid session code
- **THEN** the peer connection is established and video streams correctly despite the version badge being displayed
