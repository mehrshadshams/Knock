## Why

The current deployment uses ACR admin credentials (username + password) stored as GitHub Actions secrets and embedded in the Container App configuration. Storing static credentials violates the principle of least privilege and creates a rotation burden. Azure managed identity eliminates passwords entirely by granting the Container App's identity direct `AcrPull` RBAC access to the registry — no secrets, no rotation, no leakage risk.

## What Changes

- **BREAKING (Bicep)**: Remove `adminUserEnabled: true` from the ACR resource
- **BREAKING (Bicep)**: Remove the `secrets` and `registries` (username/password) blocks from the Container App configuration
- Add a system-assigned managed identity to the Container App
- Add an `AcrPull` role assignment granting the Container App's managed identity pull access to the ACR
- Configure the Container App to use the managed identity for registry authentication (via `identity` on the registry entry)
- Update `README.md`: remove `ACR_USERNAME` and `ACR_PASSWORD` from the required GitHub secrets list (the workflow already authenticates to ACR via the service principal — no admin credentials needed for push either)

## Capabilities

### New Capabilities

- `container-app-managed-identity`: System-assigned managed identity on the Container App and the `AcrPull` RBAC role assignment that grants it pull access to ACR — replacing all password-based registry authentication

### Modified Capabilities

## Impact

- `infra/main.bicep`: Remove admin credential usage; add `identity`, `roleAssignment`, and update `registries` block to use `identity` instead of `username`/`passwordSecretRef`
- `README.md`: Remove `ACR_USERNAME` and `ACR_PASSWORD` from the secrets table (4 secrets remain instead of 6)
- `.github/workflows/deploy.yml`: No changes needed — push already authenticates via the service principal (`az acr login` uses the SP token from `az login`)
- ACR admin account is disabled after this change — no fallback to password auth
