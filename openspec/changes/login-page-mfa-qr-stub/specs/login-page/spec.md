## ADDED Requirements

### Requirement: Login route
The system SHALL serve the placeholder login page at the URL path `/login`.

#### Scenario: Direct navigation to /login
- **WHEN** a user issues a `GET /login` request
- **THEN** the server SHALL respond with HTTP 200 and the contents of `public/login.html` with `Content-Type: text/html`

#### Scenario: Other routes unaffected
- **WHEN** a user navigates to `/` or any other existing route
- **THEN** the server SHALL respond exactly as it did before this change (no behavior change to existing routes)

### Requirement: Credential input fields
The login page SHALL include username and password input fields styled consistently with the rest of the app.

#### Scenario: Username and password fields present
- **WHEN** a user loads `/login`
- **THEN** the page SHALL display a text input for "Username" and a password input for "Password", both visually consistent with existing form inputs

#### Scenario: Continue navigates to home without validation
- **WHEN** the user clicks the "Continue" button (or submits the form)
- **THEN** the page SHALL prevent any default form submission and navigate the browser to `/`

#### Scenario: Preview notice visible
- **WHEN** the login page is displayed
- **THEN** a notice SHALL be visible stating that the page is a preview and real sign-in / MFA verification will be enabled in a future release

### Requirement: MFA QR enrollment panel
The login page SHALL display a panel containing a QR code suitable for later TOTP authenticator-app enrollment.

#### Scenario: QR panel visible
- **WHEN** the login page is displayed
- **THEN** the page SHALL render a labeled panel titled "Set up authenticator app" containing a QR code

#### Scenario: QR encodes an otpauth URI
- **WHEN** the QR code is generated
- **THEN** the encoded payload SHALL be an `otpauth://totp/...` URI with `issuer=Knock` and a 32-character base32 `secret` parameter

#### Scenario: Secret is ephemeral
- **WHEN** the page is loaded
- **THEN** the `secret` parameter SHALL be generated fresh client-side for that page load, SHALL NOT be transmitted to the server, and SHALL NOT be persisted between loads

### Requirement: Client-side QR rendering with no external runtime dependency
The QR code SHALL be rendered entirely client-side using a vendored library file served from the application's static assets.

#### Scenario: No CDN or third-party network calls
- **WHEN** the login page loads
- **THEN** the QR rendering SHALL NOT make any network requests to third-party hosts (no CDN, no external API)

#### Scenario: Renders into a canvas of fixed size
- **WHEN** the QR code is rendered
- **THEN** it SHALL be drawn into an HTML `<canvas>` element of at least 180×180 CSS pixels and at most 320×320 CSS pixels

### Requirement: No real authentication
The login page SHALL NOT perform any real authentication, secret storage, or MFA verification in this change.

#### Scenario: No credentials sent to server
- **WHEN** the user interacts with the login page (typing, clicking Continue, submitting the form)
- **THEN** no credentials, secrets, or QR-derived values SHALL be transmitted to the server

#### Scenario: No session or cookie established
- **WHEN** the user clicks Continue
- **THEN** the system SHALL NOT set any authentication cookie, header, or session identifier
