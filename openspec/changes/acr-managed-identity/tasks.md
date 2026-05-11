## 1. Bicep — Managed Identity & Role Assignment

- [x] 1.1 Add `identity: { type: 'SystemAssigned' }` to the Container App resource in `infra/main.bicep`
- [x] 1.2 Add a `Microsoft.Authorization/roleAssignments` resource scoped to the ACR, assigning the `AcrPull` role (`7f951dda-4ed3-4680-a7ca-43fe172d538d`) to `ca.identity.principalId`
- [x] 1.3 Replace the Container App `registries` block: remove `username` and `passwordSecretRef`, add `identity: 'system'`
- [x] 1.4 Remove the `secrets` array (ACR password secret) from the Container App `configuration` block
- [x] 1.5 Set `adminUserEnabled: false` on the ACR resource

## 2. Bicep — Validate

- [x] 2.1 Run `az bicep build --file infra/main.bicep` and confirm zero errors

## 3. README — Remove Stale Secrets

- [x] 3.1 Remove `ACR_USERNAME` and `ACR_PASSWORD` rows from the secrets table in `README.md`
- [x] 3.2 Add a note in the README migration section about the RBAC propagation delay (up to 5 minutes on first deploy)
