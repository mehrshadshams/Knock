## Why

We plan to add multi-factor authentication (MFA) to Knock in a future change, but the underlying login surface does not yet exist. To unblock UX exploration and let users start enrolling authenticator apps ahead of the auth wiring, this change introduces a **placeholder login page** that already displays a QR code suitable for later TOTP MFA enrollment. No real authentication, secrets, or verification logic is included — this is intentionally a UI scaffold so the visual surface is in place when the MFA backend lands.

## What Changes

- Add a new `/login` route served by the existing static file handler in `server.js` (mapped to `public/login.html`).
- Add a `public/login.html` page styled consistently with the existing home screen, containing:
  - Username and password input fields (non-functional placeholders — no submission target wired to real auth).
  - A "Continue" button that, for now, simply navigates back to `/` (the call home screen).
  - A QR code panel labeled "Set up authenticator app" displaying a QR code generated from a placeholder `otpauth://totp/...` URI.
- Add a small QR-rendering script (`public/qr.js`) — a vendored, MIT-licensed minimal QR encoder rendered into a `<canvas>` — so we don't pull in a build step or external CDN dependency.
- The QR's `otpauth://` URI uses a fixed demo issuer (`Knock`) and a per-page-load random base32 "secret" (client-side only) so the displayed code is realistic but not bound to any real account.
- No backend, no session, no storage, no real verification. The page is clearly marked as a preview ("MFA enrollment will be enabled in a future release.").

## Capabilities

### New Capabilities
- `login-page`: A placeholder login UI scaffold that includes credential input fields and a QR code panel intended for later TOTP MFA enrollment. Defines the visual contract and routing — not authentication behavior.

### Modified Capabilities
<!-- None: purely additive UI scaffolding. -->

## Impact

- **Server (`server.js`)**: Add a `/login` route mapping to `public/login.html` (or rely on the existing static file resolver if `/login.html` is acceptable as the canonical URL; see design).
- **Client (`public/login.html`, `public/login.css` or shared styles, `public/login.js`, `public/qr.js`)**: New page + a small QR rendering helper.
- **Routing**: New URL `/login`; existing routes unchanged.
- **No security impact**: the page does not authenticate or store secrets. The displayed `otpauth://` URI is randomly generated client-side per visit.
- **Spec surface**: New `login-page` capability spec; no deltas to existing specs.
