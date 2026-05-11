# WebRTC Call

A browser-based 1:1 video calling application. Two users connect by sharing a short session code — no accounts, no installs required.

## Running locally

```bash
npm install
npm start          # http://localhost:3000
```

Open the URL in two browser tabs, click **Start a Call** in one, copy the 6-character code, paste it in the other tab and click **Join**.

### Run with Docker

```bash
# Build image
docker build -t webrtc-call:local .

# Run container
docker run --rm -p 3000:3000 --name webrtc-call webrtc-call:local
```

Then open `http://localhost:3000`.

Useful checks:

```bash
docker ps
docker logs webrtc-call
docker stop webrtc-call
```

---

## Deployment

Deploy to **Azure Container Apps** for a public HTTPS URL with zero infrastructure management.

### Prerequisites

| Tool | Install |
|------|---------|
| [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) | `brew install azure-cli` |
| [Docker](https://docs.docker.com/get-docker/) | Docker Desktop |
| Azure subscription | [Free account](https://azure.microsoft.com/free/) |
| GitHub repository | With Actions enabled |

---

### Step 1 — One-time Azure provisioning

```bash
# Log in
az login

# Create a resource group (choose your preferred region)
az group create --name webrtc-rg --location eastus

# Edit infra/main.bicepparam — set a globally unique acrName, then deploy:
az deployment group create \
  --resource-group webrtc-rg \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam

# The deployment outputs the Container App FQDN and ACR login server:
# outputs.fqdn          → your-app.eastus.azurecontainerapps.io
# outputs.acrLoginServer → webrtccallacr.azurecr.io
```

---

### Step 2 — Create GitHub Actions secrets

In your GitHub repository go to **Settings → Secrets and variables → Actions** and add:

| Secret name | Value |
|-------------|-------|
| `AZURE_CREDENTIALS` | JSON output of `az ad sp create-for-rbac --name webrtc-deploy --role contributor --scopes /subscriptions/<SUB_ID>/resourceGroups/webrtc-rg --sdk-auth` |
| `ACR_LOGIN_SERVER` | e.g. `webrtccallacr.azurecr.io` |
| `AZURE_RESOURCE_GROUP` | `webrtc-rg` |
| `CONTAINER_APP_NAME` | `webrtc-call` |

---

### Step 3 — Deploy

Push to `main` — GitHub Actions will automatically:
1. Build the Docker image
2. Push it to ACR (tagged with the commit SHA and `latest`)
3. Update the Container App to the new image

> **Note — RBAC propagation**: On the very first deployment, Azure may take up to 5 minutes to propagate the `AcrPull` role assignment to the Container App's managed identity. If the Container App fails to pull the image immediately, wait a few minutes and trigger a new revision (or re-run the workflow).

---

### Optional — Push Docker image manually to ACR

Use this when you want to push an image yourself (outside GitHub Actions).

```bash
# Variables
RG=webrtc-rg
ACR_NAME=<your-acr-name>                 # e.g. webrtccallacr
ACR_LOGIN_SERVER=$(az acr show -n $ACR_NAME --query loginServer -o tsv)
IMAGE_NAME=webrtc-call
IMAGE_TAG=$(git rev-parse --short HEAD)

# Sign in to Azure and ACR
az login
az acr login --name $ACR_NAME

# Build and tag
docker build -t $IMAGE_NAME:$IMAGE_TAG .
docker tag $IMAGE_NAME:$IMAGE_TAG $ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_TAG
docker tag $IMAGE_NAME:$IMAGE_TAG $ACR_LOGIN_SERVER/$IMAGE_NAME:latest

# Push tags
docker push $ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_TAG
docker push $ACR_LOGIN_SERVER/$IMAGE_NAME:latest
```

Verify what was pushed:

```bash
az acr repository show-tags \
  --name $ACR_NAME \
  --repository $IMAGE_NAME \
  -o table
```

If needed, update Container App to a specific tag:

```bash
az containerapp update \
  --name webrtc-call \
  --resource-group $RG \
  --image $ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_TAG
```

Common issues:
1. `unauthorized: authentication required` -> run `az acr login --name $ACR_NAME` again.
2. `repository does not exist` -> confirm `$IMAGE_NAME` matches the pushed repo name.
3. New image not visible in app -> run `az containerapp revision list --name webrtc-call --resource-group $RG -o table` and check latest revision status.

---

### Get the public URL

```bash
az containerapp show \
  --name $CONTAINER_APP_NAME \
  --resource-group $AZURE_RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn \
  -o tsv
```

The app is served over **HTTPS** at `https://<fqdn>`.

---

### Rollback

Re-activate a previous revision:

```bash
az containerapp revision list --name webrtc-call --resource-group webrtc-rg -o table
az containerapp revision activate --name webrtc-call --resource-group webrtc-rg --revision <revision-name>
```

---

> **Cost note**: Azure Container Apps has a generous free tier (180,000 vCPU-seconds/month). `minReplicas: 1` keeps one replica running at all times — check [pricing](https://azure.microsoft.com/pricing/details/container-apps/) for your usage.
