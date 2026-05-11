#!/usr/bin/env bash
# deploy.sh — Build with ACR remote build and deploy to Azure Container Apps
# Based on: https://learn.microsoft.com/en-us/azure/container-apps/tutorial-code-to-cloud
set -euo pipefail

# ── Variables ──────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Read values from bicepparam so they stay in sync
RG="webrtc-rg"
LOCATION="eastus"
ACR_NAME="webrtccallacr"      # must be globally unique, alphanumeric only
APP_NAME="webrtc-call"
ENV_NAME="${APP_NAME}-env"

IMAGE_TAG="$(git -C "$PROJECT_ROOT" rev-parse --short HEAD 2>/dev/null || echo "latest")"
IMAGE_REPO="${APP_NAME}"
BUILD_HASH="$IMAGE_TAG"  # Use git short SHA as the build hash

echo "========================================================="
echo "  WebRTC — Azure Container Apps deploy"
echo "  Resource group : $RG ($LOCATION)"
echo "  ACR            : ${ACR_NAME}.azurecr.io"
echo "  Image tag      : $IMAGE_TAG"
echo "========================================================="

# ── Step 1: Azure login ────────────────────────────────────────────────────────
echo ""
echo ">>> [1/7] Logging in to Azure..."
az login

# ── Step 2: Upgrade CLI and install containerapp extension ─────────────────────
echo ""
echo ">>> [2/7] Installing/upgrading containerapp CLI extension..."
az extension add --name containerapp --upgrade --yes 2>/dev/null || true

echo "      Registering required Azure providers (runs in background)..."
az provider register --namespace Microsoft.App &
az provider register --namespace Microsoft.OperationalInsights &
wait

# ── Step 3: Create resource group ─────────────────────────────────────────────
echo ""
echo ">>> [3/7] Ensuring resource group '$RG' exists..."
az group create --name "$RG" --location "$LOCATION" --output none
echo "      Resource group ready."

# ── Step 4: Create ACR (idempotent) and enable ARM-token auth ─────────────────
echo ""
echo ">>> [4/7] Ensuring ACR '$ACR_NAME' exists..."
az acr create \
  --resource-group "$RG" \
  --location "$LOCATION" \
  --name "$ACR_NAME" \
  --sku Basic \
  --output none 2>/dev/null || echo "      ACR already exists, continuing."

echo "      Enabling ARM-token authentication on ACR..."
az acr config authentication-as-arm update \
  --registry "$ACR_NAME" \
  --status enabled \
  --output none

# ── Step 5: Remote build + push via ACR Tasks (no local Docker needed) ─────────
echo ""
echo ">>> [5/7] Building image remotely with ACR Tasks..."
echo "      Source: $PROJECT_ROOT"
echo "      Target: ${ACR_NAME}.azurecr.io/${IMAGE_REPO}:${IMAGE_TAG} (and :latest)"
echo "      Build Hash: $BUILD_HASH"
az acr build \
  --registry "$ACR_NAME" \
  --image "${IMAGE_REPO}:${IMAGE_TAG}" \
  --image "${IMAGE_REPO}:latest" \
  --build-arg "BUILD_HASH=${BUILD_HASH}" \
  "$PROJECT_ROOT"

echo "      Image pushed successfully."

# ── Step 6: Deploy infrastructure + app via Bicep ──────────────────────────────
echo ""
echo ">>> [6/7] Deploying infrastructure and container app via Bicep..."
echo "      Template : infra/main.bicep"
echo "      Params   : infra/main.bicepparam  (imageTag overridden to $IMAGE_TAG)"

DEPLOY_OUTPUT="$(az deployment group create \
  --resource-group "$RG" \
  --template-file "${PROJECT_ROOT}/infra/main.bicep" \
  --parameters "${PROJECT_ROOT}/infra/main.bicepparam" \
  --parameters imageTag="$IMAGE_TAG" \
  --output json)"

FQDN="$(echo "$DEPLOY_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['properties']['outputs']['fqdn']['value'])")"

echo ""
echo "      Bicep deployment complete."
echo "      FQDN: $FQDN"

# ── Step 7: Health-check loop ──────────────────────────────────────────────────
echo ""
echo ">>> [7/7] Waiting for app to become reachable at https://${FQDN} ..."
echo "      (RBAC propagation may take a few minutes on first deploy)"

MAX_ATTEMPTS=24   # 24 × 15 s = 6 minutes
ATTEMPT=0
HTTP_STATUS="000"

while [[ $ATTEMPT -lt $MAX_ATTEMPTS ]]; do
  ATTEMPT=$((ATTEMPT + 1))
  HTTP_STATUS="$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${FQDN}" 2>/dev/null || echo "000")"

  if [[ "$HTTP_STATUS" == "200" ]]; then
    echo ""
    echo "========================================================="
    echo "  ✅  App is UP!"
    echo "  URL : https://${FQDN}"
    echo "  HTTP: $HTTP_STATUS"
    echo "========================================================="
    break
  fi

  echo "  Attempt ${ATTEMPT}/${MAX_ATTEMPTS}: HTTP ${HTTP_STATUS} — retrying in 15 s..."
  sleep 15
done

if [[ "$HTTP_STATUS" != "200" ]]; then
  echo ""
  echo "========================================================="
  echo "  ⚠️  App did not respond with 200 after $((MAX_ATTEMPTS * 15)) seconds."
  echo "  Last HTTP status: $HTTP_STATUS"
  echo ""
  echo "  Diagnose with:"
  echo "    az containerapp logs show --name $APP_NAME --resource-group $RG --follow"
  echo "    az containerapp revision list --name $APP_NAME --resource-group $RG -o table"
  echo "========================================================="
  exit 1
fi
