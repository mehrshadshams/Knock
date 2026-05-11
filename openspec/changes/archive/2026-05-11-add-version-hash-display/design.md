## Context

The WebRTC application is deployed to Azure Container Apps via an automated pipeline (scripts/deploy.sh). Currently, there is no visible indication of which version or build is running. During debugging and production issues, developers must check logs or metrics to correlate behavior with a specific deployment. The application has a simple frontend (public/index.html, public/main.js) and a Node.js backend (server.js).

## Goals / Non-Goals

**Goals:**
- Display version:hash badge at the top of the page (easily visible, non-intrusive)
- Embed version information at build time (from package.json)
- Embed build hash at deploy time (Docker image digest or git SHA)
- Maintain zero-impact on core WebRTC functionality

**Non-Goals:**
- Version checking or update mechanisms
- Backend API changes for version endpoints
- Complex versioning logic (e.g., semantic versioning comparisons)
- Server-side rendering or dynamic version updates

## Decisions

1. **Version Source: package.json**
   - Store application version in `package.json` version field
   - Rationale: Standard Node.js convention, easy to read and maintain
   - Alternative considered: Hardcoded version in code (rejected - requires manual updates)

2. **Hash Source: Environment Variable Injected at Deploy Time**
   - Hash is set via BUILD_HASH environment variable during deployment
   - Value: Docker image digest or git commit SHA passed by deploy.sh
   - Rationale: Build hash is known at container build time, not code-time. Using env var allows flexibility (supports both Docker digest and git SHA)
   - Alternative considered: Read from embedded file during build (rejected - adds complexity to build pipeline)

3. **Frontend Injection Method: JavaScript on Page Load**
   - Create hidden META tag in HTML with version data (e.g., `<meta name="app-version" content="1.0.0">`)
   - JavaScript (main.js) reads META tag and injects version:hash badge into DOM
   - Badge placed in fixed position at top of page (z-index priority)
   - Rationale: Non-intrusive, doesn't require HTML template changes, version loads quickly before WebRTC initialization
   - Alternative considered: Server-side rendering (rejected - requires backend changes, overkill)

4. **Hash Availability During Development**
   - If BUILD_HASH not set (local development), use shortened git SHA from CLI or "dev" placeholder
   - Rationale: Enables version display in all environments without breaking local development

5. **Badge Styling**
   - Minimal CSS: small gray/translucent badge, fixed position top-right
   - Font: monospace for hash readability
   - Rationale: Visible for debugging, doesn't distract from core UI, easily hideable via DevTools

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Deploy.sh complexity increases with version injection logic | Keep logic simple: single env var injection, no parsing required |
| Version mismatch if BUILD_HASH not set | Provide sensible default ("dev" or git SHA) and document requirement |
| Badge takes up screen space or interferes with layout | Use fixed positioning and low z-index initially; monitor feedback |
| Frontend can't access BUILD_HASH if not passed as env to client | Embed BUILD_HASH in HTML file during docker build (e.g., via sed/replace) or pass via window global from server response |

## Migration Plan

1. Update `package.json` with version field (if not present)
2. Modify `public/index.html`: Add meta tag with version placeholder
3. Modify `public/main.js`: Add code to read version and build hash, inject badge
4. Update `scripts/deploy.sh`: Extract Docker image digest or use git SHA as BUILD_HASH
5. Update `Dockerfile`: Pass BUILD_HASH to HTML build step (via sed substitution or ENV)
6. Test locally: Verify version displays correctly
7. Deploy and verify on Azure Container Apps

## Open Questions

- Should version:hash be accessible via backend API for automated monitoring/dashboards?
- Do we track version history or just display current version?
- Should the badge be user-toggleable (show/hide) or always visible?
