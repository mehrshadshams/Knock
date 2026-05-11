## Context

The WebRTC video calling application is a single Node.js process (`server.js`) that serves static files and handles WebSocket signaling. It already reads `process.env.PORT` for its listening port. There are no databases, no build steps, and no compiled assets — the entire runtime is Node.js + the `ws` package. The goal is to wrap this in Docker and host it on Azure Container Apps so it is reachable via a public HTTPS URL.

## Goals / Non-Goals

**Goals:**
- Produce a minimal Docker image (~node:alpine base) that runs `npm start`
- Define Azure infrastructure as code using Bicep: Container Registry, Container Apps Environment, and Container App with external HTTPS ingress
- Automate image build → push → deploy via GitHub Actions on every push to `main`
- Expose the app at a stable public HTTPS URL provided by Azure Container Apps

**Non-Goals:**
- Custom domain / TLS certificate management (Azure provides a default `*.azurecontainerapps.io` HTTPS URL)
- Multi-region or geo-redundant deployment
- Auto-scaling beyond the built-in Container Apps defaults
- Secrets management beyond GitHub Actions secrets + Azure managed identity for ACR pull
- TURN server provisioning (out of scope per existing design)

## Decisions

### 1. Docker base image
**Decision**: `node:22-alpine` as the single-stage base.

**Rationale**: Alpine keeps the image small (~150 MB vs ~1 GB for `node:22`). The app has no native addons that require build tooling, so a multi-stage build adds complexity without benefit.

**Alternatives considered**:
- `node:22-slim` (Debian): Larger, no advantage for a pure-JS app.
- Multi-stage build: Unnecessary — there is no compile/transpile step.

---

### 2. Infrastructure as Code tool
**Decision**: Azure Bicep (`infra/main.bicep` + `infra/main.bicepparam`).

**Rationale**: Bicep is the recommended Azure-native IaC language. It compiles to ARM, requires no external state file, and integrates natively with `az deployment` commands used in CI/CD. Terraform would require state management.

**Alternatives considered**:
- Terraform: More portable but requires remote state and a heavier pipeline setup.
- Azure CLI only (no IaC): Fragile, not repeatable.
- Azure Developer CLI (`azd`): Good option but adds a tool dependency; Bicep alone is simpler.

---

### 3. Container Registry
**Decision**: Azure Container Registry (ACR) in the same resource group, with admin credentials stored as GitHub Actions secrets.

**Rationale**: ACR integrates natively with Container Apps and keeps images within the Azure tenancy. Admin credentials are simple to set up for MVP.

**Alternatives considered**:
- GitHub Container Registry (GHCR): Works but requires configuring pull credentials on the Container App separately.
- Managed Identity ACR pull: More secure but requires additional RBAC setup; recommended as a post-MVP hardening step.

---

### 4. GitHub Actions workflow structure
**Decision**: Single workflow file (`.github/workflows/deploy.yml`) triggered on `push` to `main`. Steps: checkout → `az login` (service principal) → `docker build & push` → `az containerapp update`.

**Rationale**: Keeps the pipeline simple and self-contained. No separate build/deploy jobs needed at this scale.

---

### 5. Container App ingress
**Decision**: External ingress on port 80 (Container Apps terminates TLS and proxies to the container's `PORT`). The app listens on `PORT=80` inside the container (set via environment variable in the Container App definition).

**Rationale**: Container Apps handles HTTPS termination automatically on its ingress. The app only needs to listen on HTTP internally.

## Risks / Trade-offs

- **ACR admin credentials in GitHub Secrets** → Rotate credentials if leaked; post-MVP migrate to workload identity.
- **In-memory signaling sessions** → Container App restarts (e.g., after deploy) drop active calls. Mitigation: Deploy outside peak hours; add drain logic post-MVP.
- **WebSocket support** → Azure Container Apps supports WebSockets on HTTP/1.1 ingress. Ensure `transport: http1` is set (this is the default).
- **Cold-start latency** → Container Apps may scale to zero. Set `minReplicas: 1` to avoid cold starts for this real-time app.
- **Free-tier limits** → Azure Container Apps has a generous free tier but consumption charges apply at scale. Document this in README.

## Migration Plan

1. Provision Azure resources once using `az deployment group create` with the Bicep template.
2. Push initial image manually (or via first CI run) to ACR.
3. Configure GitHub Actions secrets (`AZURE_CREDENTIALS`, `ACR_LOGIN_SERVER`, `ACR_USERNAME`, `ACR_PASSWORD`, `AZURE_RESOURCE_GROUP`, `CONTAINER_APP_NAME`).
4. Merge to `main` to trigger the automated deploy.
5. Verify the app is reachable at the Container App's FQDN over HTTPS.

**Rollback**: Re-run the workflow targeting the previous image tag, or use `az containerapp revision activate` to re-activate the prior revision.
