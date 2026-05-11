## 1. Setup & Configuration

- [x] 1.1 Verify version field exists in package.json (add if missing)
- [x] 1.2 Determine build hash strategy (Docker digest or git SHA)
- [x] 1.3 Document version display implementation plan for team

## 2. Frontend Implementation

- [x] 2.1 Add meta tag to public/index.html for app version placeholder
- [x] 2.2 Create CSS styles for version badge (fixed position, monospace font, translucent)
- [x] 2.3 Add JavaScript logic to public/main.js to read version from meta tag
- [x] 2.4 Add JavaScript logic to read BUILD_HASH from global window object or meta attribute
- [x] 2.5 Implement DOM injection to create and insert version badge element at page top
- [x] 2.6 Ensure badge z-index doesn't block interactive elements (buttons, video)

## 3. Build Pipeline Integration

- [x] 3.1 Update scripts/deploy.sh to extract Docker image digest after ACR build
- [x] 3.2 Add BUILD_HASH export to deploy.sh before Bicep deployment
- [x] 3.3 Update deploy.sh to pass BUILD_HASH to Dockerfile or subsequent build steps
- [x] 3.4 Verify BUILD_HASH is available in all deployment environments (local, CI/CD)

## 4. Docker & Container Configuration

- [x] 4.1 Update Dockerfile to accept BUILD_HASH as build argument (ARG)
- [x] 4.2 Modify Dockerfile to inject BUILD_HASH into public/index.html at build time (e.g., via sed or template substitution)
- [x] 4.3 Ensure BUILD_HASH is passed as environment variable to Container App in Bicep template (if needed)
- [x] 4.4 Test Docker build locally with BUILD_HASH argument

## 5. Local Development Support

- [x] 5.1 Create script or documentation for setting BUILD_HASH locally (use git SHA shorthand)
- [x] 5.2 Ensure version badge displays correctly in local `npm run dev` or direct browser open
- [x] 5.3 Add fallback logic so missing BUILD_HASH doesn't break page load

## 6. Testing & Verification

- [x] 6.1 Test version badge displays on initial page load
- [x] 6.2 Verify badge persists during WebRTC call (video stream, peer connection)
- [x] 6.3 Confirm badge doesn't block "Start a Call" button or "Join" input
- [x] 6.4 Test badge formatting matches version:hash specification
- [x] 6.5 Verify version updates after deploying new package.json version
- [x] 6.6 Test fallback behavior when BUILD_HASH is not set
- [x] 6.7 Confirm monospace font and translucent styling render correctly across browsers

## 7. Deployment & Documentation

- [x] 7.1 Update scripts/deploy.sh comments to document BUILD_HASH extraction and passing
- [x] 7.2 Update README.md with explanation of version display feature
- [x] 7.3 Deploy to Azure Container Apps and verify version badge displays
- [x] 7.4 Monitor production logs to ensure no errors related to version display
- [x] 7.5 Confirm no performance degradation from badge injection
