## Why

The WebRTC video calling application currently runs only on a developer's local machine. To make it accessible to real users over the internet it needs to be containerised with Docker and deployed to a managed cloud platform. Azure Container Apps provides serverless container hosting with built-in HTTPS ingress, making it the fastest path from local Node.js app to a publicly reachable URL.

## What Changes

- Add a `Dockerfile` that packages the Node.js signaling server and static frontend into a production-ready container image
- Add a `.dockerignore` to exclude `node_modules`, `openspec/`, and other dev artefacts from the image
- Add Azure Container Apps deployment configuration (Bicep infrastructure-as-code)
- Add a GitHub Actions CI/CD workflow that builds the Docker image, pushes it to Azure Container Registry, and deploys to Azure Container Apps on every push to `main`
- Document the deployment steps and required Azure resources in `README.md`

## Capabilities

### New Capabilities

- `dockerfile`: A multi-stage (or single-stage) Dockerfile that builds a minimal, production-ready image of the Node.js app; image must expose the correct port and run `npm start`
- `azure-container-apps`: Azure Container Apps environment and app definition (Bicep) that hosts the container, configures external HTTPS ingress on port 443, and maps to the container's HTTP port
- `azure-container-registry`: Azure Container Registry resource (Bicep) for storing and serving the Docker image; includes the registry credentials wired into the Container App
- `cicd-pipeline`: GitHub Actions workflow that builds the image, pushes to ACR, and deploys (updates) the Container App on every push to `main`

### Modified Capabilities

## Impact

- New files: `Dockerfile`, `.dockerignore`, `infra/main.bicep`, `infra/main.bicepparam`, `.github/workflows/deploy.yml`
- `README.md` updated with deployment instructions and prerequisites
- No changes to application source code (`server.js`, `public/`)
- Requires: Azure subscription, Azure CLI, Docker, GitHub repository with Actions enabled
- The app listens on `process.env.PORT` (already implemented in `server.js`) — Container Apps will inject `PORT` via environment variable
