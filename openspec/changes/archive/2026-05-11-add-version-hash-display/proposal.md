## Why

During development and debugging, it's difficult to quickly identify which version of the application is deployed. Adding a visible version and build hash at the top of the page enables rapid confirmation of deployment status and helps correlate behavior with specific builds.

## What Changes

- Add a version display badge at the top of the WebRTC application showing format `version:hash`
- Integrate build information into deployment pipeline and client application
- Display version/hash persistently on the first page without impacting core functionality

## Capabilities

### New Capabilities

- `version-display`: Displays application version and build hash (git commit SHA or image digest) at the top of the page, enabling quick identification of deployed version

### Modified Capabilities

<!-- No existing capability requirements are changing -->

## Impact

- **Frontend**: `public/index.html` (DOM modification for version badge), `public/main.js` (version population logic)
- **Build/Deployment**: `package.json` (version metadata), `scripts/deploy.sh` (inject hash during build)
- **Docker**: `Dockerfile` (optional: include version information in image)
- **Infrastructure**: Minor UI change, no API/backend changes required
