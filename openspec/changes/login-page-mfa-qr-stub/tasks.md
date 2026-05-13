## 1. Server route

- [x] 1.1 Add an early-return branch in `server.js` HTTP handler so `GET /login` resolves to `public/login.html` with `Content-Type: text/html`
- [x] 1.2 Verify other existing routes (`/`, `/webrtc-config`, static files) still behave identically

## 2. Vendored QR encoder

- [x] 2.1 Add `public/qr.js` containing a minimal, MIT-licensed QR encoder (e.g., Kazuhiko Arase's `qrcode-generator`) with a top-of-file comment listing source URL, version, and license
- [x] 2.2 Expose a small wrapper API (e.g., `window.QR.renderToCanvas(canvas, text, sizePx)`) so `login.js` does not depend on the library's internals

## 3. Login page markup

- [x] 3.1 Create `public/login.html` with: page header, "Preview only" notice, username input, password input, "Continue" button, and a "Set up authenticator app" panel containing a `<canvas id="mfa-qr">`
- [x] 3.2 Reuse existing `style.css` classes (`.card`, `.btn`, `.btn-primary`, form input styles) for visual consistency
- [x] 3.3 Add any login-specific styles (QR panel layout, preview banner) in a small `<style>` block at the top of `login.html` (or appended to `style.css`)

## 4. Login page behavior

- [x] 4.1 Create `public/login.js` that generates a 32-character random base32 secret using `crypto.getRandomValues`
- [x] 4.2 Build an `otpauth://totp/Knock:demo@knock?secret=<base32>&issuer=Knock&algorithm=SHA1&digits=6&period=30` URI
- [x] 4.3 On `DOMContentLoaded`, call `window.QR.renderToCanvas(...)` to draw the URI into `#mfa-qr` at ~220×220 px
- [x] 4.4 Wire the form `submit` and Continue-button `click` handlers to call `event.preventDefault()` and navigate to `/`
- [x] 4.5 Ensure no `fetch`, `XMLHttpRequest`, or WebSocket calls are made from this page

## 5. Verification

- [ ] 5.1 Manually verify: `http://localhost:3000/login` loads the page and renders the QR code
- [ ] 5.2 Manually verify: scanning the QR in an authenticator app produces an "added" account labeled `Knock` with rotating 6-digit codes (not bound to any real backend)
- [ ] 5.3 Manually verify: clicking Continue navigates to `/` without any network request to the server containing credentials
- [ ] 5.4 Manually verify: reloading `/login` generates a different secret each time
- [ ] 5.5 Manually verify: page renders correctly at 320 px viewport width
