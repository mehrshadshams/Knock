## 1. Docker

- [x] 1.1 Create `.dockerignore` excluding `node_modules/`, `openspec/`, `.git/`, `*.md`, `.github/`, and `infra/`
- [x] 1.2 Create `Dockerfile` using `node:22-alpine`, copy `package.json` and `package-lock.json`, run `npm ci --omit=dev`, copy `server.js` and `public/`, expose the port, and set `CMD ["node", "server.js"]`
- [x] 1.3 Verify image builds locally: `docker build -t webrtc-call .`
- [x] 1.4 Verify container runs locally: `docker run --rm -e PORT=3000 -p 3000:3000 webrtc-call` and confirm HTTP 200 at `http://localhost:3000`

## 2. Azure Infrastructure (Bicep)

- [x] 2.1 Create `infra/` directory and `infra/main.bicep` defining: `Microsoft.ContainerRegistry/registries` (Basic SKU, adminUserEnabled: true)
- [x] 2.2 Add `Microsoft.App/managedEnvironments` resource to `infra/main.bicep`
- [x] 2.3 Add `Microsoft.App/containerApps` resource to `infra/main.bicep` with: external ingress (`external: true`, `targetPort: 80`, `transport: http`), `minReplicas: 1`, `env: [{name: "PORT", value: "80"}]`, and ACR registry credentials wired via parameters
- [x] 2.4 Add Bicep output `fqdn` exposing the Container App's fully-qualified domain name
- [x] 2.5 Create `infra/main.bicepparam` with parameter defaults (location, appName, acrName)
- [x] 2.6 Validate the Bicep template: `az bicep build --file infra/main.bicep`

## 3. GitHub Actions CI/CD

- [x] 3.1 Create `.github/workflows/deploy.yml` with trigger `on: push: branches: [main]`
- [x] 3.2 Add job steps: checkout, `az login` with `AZURE_CREDENTIALS` secret, `az acr login`
- [x] 3.3 Add steps: `docker build`, tag with `$ACR_LOGIN_SERVER/webrtc-call:${{ github.sha }}` and `:latest`, `docker push` both tags
- [x] 3.4 Add final step: `az containerapp update --name $CONTAINER_APP_NAME --resource-group $AZURE_RESOURCE_GROUP --image $ACR_LOGIN_SERVER/webrtc-call:${{ github.sha }}`
- [x] 3.5 Ensure the workflow exits non-zero (fails fast) if any step fails — verify `set -e` behaviour is covered by GitHub Actions default shell

## 4. README Deployment Docs

- [x] 4.1 Add a `## Deployment` section to `README.md` listing all prerequisites (Azure CLI, Docker, GitHub repo with Actions, Azure subscription)
- [x] 4.2 Document one-time Azure provisioning: `az login`, `az group create`, `az deployment group create --template-file infra/main.bicep`
- [x] 4.3 Document how to retrieve ACR credentials and create the 6 required GitHub Actions secrets (`AZURE_CREDENTIALS`, `ACR_LOGIN_SERVER`, `ACR_USERNAME`, `ACR_PASSWORD`, `AZURE_RESOURCE_GROUP`, `CONTAINER_APP_NAME`)
- [x] 4.4 Document how to get the public URL after deployment: `az containerapp show --name $CONTAINER_APP_NAME --resource-group $AZURE_RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv`

## 5. Validation

- [x] 5.1 Run `az bicep build --file infra/main.bicep` and confirm zero errors
- [x] 5.2 Confirm `.dockerignore` is effective: `docker build` context should not include `openspec/` or `node_modules/`
- [ ] 5.3 Push a commit to `main` (or trigger workflow manually) and confirm the GitHub Actions workflow completes successfully
- [ ] 5.4 Confirm the Container App FQDN returns HTTP 200 over HTTPS in a browser
- [ ] 5.5 Open two browser tabs to the public HTTPS URL, start a call in one tab, join with the code in the other, and verify the WebRTC video call connects
