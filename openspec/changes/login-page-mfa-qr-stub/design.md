## Context

Knock is a 1:1 WebRTC video call app with no user accounts, no login flow, and no server-side persistence. A future change will add real authentication and TOTP-based MFA. To prepare for that, this change introduces only the **visual scaffold** for the login page so that the QR enrollment surface can be reviewed, styled, and iterated on in isolation.

The app already has a single-page UI (`public/index.html`) and a small static-file Node.js server (`server.js`). There is no SPA framework, no build step, and no bundler. The existing pattern is plain HTML + vanilla JS + CSS, served by `server.js` from the `public/` directory.

## Goals / Non-Goals

**Goals:**
- Add a `/login` URL that serves a styled login page consistent with the existing UI.
- Include credential input fields and a QR code panel for future MFA enrollment.
- Render the QR code entirely client-side with no external network dependency and no build step.
- Make it obvious this is a preview (no real auth) so users and reviewers aren't misled.

**Non-Goals:**
- Real authentication, session management, or persistence.
- Real TOTP secret generation, storage, or verification.
- Any change to the existing call flow or home screen behavior.
- Choosing a long-term auth strategy (delegated to a future change).

## Decisions

### Decision 1: Vendor a minimal QR encoder, no CDN, no npm
Add `public/qr.js` containing a small, self-contained QR encoder (e.g., the well-known MIT-licensed `qrcode-generator` by Kazuhiko Arase, ~15 KB, rendered into a `<canvas>`).

**Rationale**: Matches the project's "no build step, no external runtime CDN" posture. Keeps the page fully self-hosted and reviewable.
**Alternative considered**: External CDN (`cdn.jsdelivr.net/...`) — rejected because it adds a runtime dependency on an external host and requires CSP review later. npm dependency — rejected because there is no client bundler.
**Trade-off**: We carry vendored code; we'll need to update it manually if a security advisory appears.

### Decision 2: Per-visit ephemeral "secret"
The QR's `otpauth://` URI uses a randomly generated 32-character base32 string regenerated each time the page loads. It is never sent to the server, never stored, and not bound to any account.

**Rationale**: Avoids any false impression that scanning the QR enrolls a real account. Lets us validate the rendering and visual contract without scoping in secret storage.

### Decision 3: Routing — explicit `/login` route
Add an explicit early-return in the HTTP handler so `GET /login` resolves to `public/login.html`. This keeps URLs clean and avoids requiring users to type `.html`.

**Alternative considered**: Rely on the existing static handler with `/login.html`. Rejected because `/login` is the conventional URL and the cost of the alias is one line.

### Decision 4: Styles reuse `style.css`
Login page reuses the existing `style.css` (same `.card`, `.btn`, input styles). Only minimal page-specific additions go into a small `<style>` block in `login.html` (or a single new rule appended to `style.css` if needed for the QR panel).

**Rationale**: Visual consistency, no new asset to maintain.

### Decision 5: The "Continue" button does not authenticate
For this stub, clicking Continue (or submitting the form) simply navigates to `/`. The form has no `action` and the JS handler calls `event.preventDefault()` then `location.href = '/'`. A small notice on the page reads: *"Preview only — real sign-in and MFA verification will be enabled in a future release."*

**Rationale**: Prevents accidental impression of working auth, while keeping the navigation flow learnable.

## Risks / Trade-offs

- **Users mistake the page for a real login** → Mitigation: visible preview banner; placeholder inputs labeled "demo only"; Continue navigates straight to the existing app without validation.
- **Vendored QR encoder drifts** → Mitigation: pin a known version in a top-of-file comment with source URL and license; small enough to re-audit if needed.
- **`/login` route conflicts with future framework routing** → Mitigation: the route is a single early-return; trivial to remove or replace when real routing lands.
- **QR rendering breaks on tiny screens** → Mitigation: fixed pixel-size canvas (e.g., 200×200) with responsive container; tested at 320 px viewport.

## Migration Plan

- Purely additive. No data, no schema, no behavior changes to existing screens.
- Rollback: remove `public/login.html`, `public/login.js`, `public/qr.js`, and the `/login` route handler in `server.js`.

## Open Questions

- Should the login page also appear in the navigation from the home screen? (v1: no — it's reachable only by typing `/login`. The home screen is unchanged.)
- Issuer label on the QR (`Knock`) — confirm acceptable for the preview. (Assumed yes.)
