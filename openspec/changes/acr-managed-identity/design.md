## Context

The existing `infra/main.bicep` provisions ACR with `adminUserEnabled: true` and configures the Container App to pull images using admin credentials stored as a Bicep-computed secret (`acr.listCredentials()`). This embeds a static password in the ARM deployment. The goal is to replace this entirely with a system-assigned managed identity + Azure RBAC, which is the Azure-recommended zero-credential pattern.

The GitHub Actions workflow already uses a service principal (`az login` → `az acr login`) to push images — no admin credentials are used in the push path. The only place passwords were used is the Container App's pull configuration, which this change removes.

## Goals / Non-Goals

**Goals:**
- Enable system-assigned managed identity on the Container App
- Assign the built-in `AcrPull` role to that identity, scoped to the ACR resource
- Switch the Container App registry configuration from `username`/`passwordSecretRef` to `identity: system`
- Disable the ACR admin user account
- Remove `ACR_USERNAME` and `ACR_PASSWORD` from the README secrets table

**Non-Goals:**
- User-assigned managed identity (system-assigned is simpler for a single app)
- Workload identity federation for GitHub Actions (the SP approach is retained for push)
- Changes to application code or the CI/CD workflow

## Decisions

### 1. System-assigned vs. user-assigned managed identity
**Decision**: System-assigned managed identity on the Container App.

**Rationale**: System-assigned identities are lifecycle-bound to the resource — they are created and deleted with the Container App automatically. No separate identity resource needs to be managed. User-assigned identities are preferable when the same identity must be shared across multiple resources, which is not the case here.

---

### 2. Role scope: ACR resource vs. resource group
**Decision**: Scope the `AcrPull` role assignment to the specific ACR resource (`acr.id`), not the resource group.

**Rationale**: Least-privilege principle. Scoping to the resource group would grant pull access to every registry in that group, including any future ones. Scoping to the specific ACR resource is the minimum required permission.

---

### 3. `identity` value in the Container App registries block
**Decision**: Set `identity: 'system'` in the Container App's `registries[].identity` field (the string literal `'system'` refers to the system-assigned identity).

**Rationale**: This is the Bicep/ARM way to tell Container Apps to use the system-assigned managed identity for registry authentication. The `username` and `passwordSecretRef` fields are omitted entirely.

---

### 4. Remove `adminUserEnabled` vs. set to `false`
**Decision**: Explicitly set `adminUserEnabled: false`.

**Rationale**: Makes the intent clear in the template and prevents anyone re-enabling it without a deliberate change. Omitting the property leaves the default ambiguous across Bicep versions.

## Risks / Trade-offs

- **Role assignment propagation delay** → Azure RBAC can take up to a few minutes to propagate after first deployment. The Container App may fail to pull on the very first deploy. Mitigation: The Container App will retry; subsequent attempts succeed once RBAC propagates. Document in README.
- **Breaking change for existing deployments** → If the ACR admin account was in use for other purposes (e.g., local `docker pull`), disabling it breaks those flows. Mitigation: Use `az acr login` with the Azure CLI (SP or user token) instead of admin credentials for local pulls.
- **No rollback to password auth** → Once admin is disabled, reverting requires re-enabling and re-storing credentials. Mitigation: This is intentional — the security improvement is the goal.

## Migration Plan

1. Apply the updated Bicep template via `az deployment group create` (idempotent re-deployment).
2. Azure assigns the managed identity and creates the role assignment automatically.
3. Allow up to 5 minutes for RBAC propagation on first deploy.
4. Remove `ACR_USERNAME` and `ACR_PASSWORD` from GitHub Actions secrets (they are no longer referenced).
5. Trigger a deploy to confirm the Container App pulls the image via managed identity.
