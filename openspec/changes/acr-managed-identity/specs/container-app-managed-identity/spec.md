## ADDED Requirements

### Requirement: System-assigned managed identity on Container App
The Container App SHALL have a system-assigned managed identity enabled so that it can authenticate to Azure services without credentials.

#### Scenario: Identity enabled in Bicep
- **WHEN** the Bicep template is deployed
- **THEN** the Container App resource SHALL have `identity.type` set to `'SystemAssigned'`

#### Scenario: No password secrets in Container App configuration
- **WHEN** the Container App configuration is inspected after deployment
- **THEN** there SHALL be no `secrets` entries containing ACR passwords and no `registries[].passwordSecretRef` fields

### Requirement: AcrPull role assignment to managed identity
The Bicep template SHALL assign the built-in `AcrPull` role to the Container App's system-assigned managed identity, scoped to the ACR resource.

#### Scenario: Role assignment provisioned
- **WHEN** the Bicep template is deployed
- **THEN** a `Microsoft.Authorization/roleAssignments` resource SHALL exist with `roleDefinitionId` for `AcrPull` (7f951dda-4ed3-4680-a7ca-43fe172d538d), `principalId` equal to the Container App's managed identity principal ID, and scope set to the ACR resource

#### Scenario: Container App can pull image without credentials
- **WHEN** the Container App starts a new replica after deployment
- **THEN** it SHALL successfully pull the container image from ACR using the managed identity, with no username or password provided

### Requirement: ACR admin account disabled
The ACR resource SHALL have the admin user account disabled so that password-based authentication is not available.

#### Scenario: Admin user disabled in Bicep
- **WHEN** the Bicep template is deployed
- **THEN** the ACR resource SHALL have `adminUserEnabled` set to `false`

#### Scenario: No admin credentials stored anywhere
- **WHEN** the deployed infrastructure is audited
- **THEN** there SHALL be no ACR admin passwords stored in Container App secrets, GitHub Actions secrets, or any other configuration store

### Requirement: Registry entry uses managed identity
The Container App's registry configuration SHALL reference the ACR using `identity: 'system'` instead of a username and password.

#### Scenario: Managed identity used for registry pull
- **WHEN** the Container App configuration is inspected
- **THEN** the `registries` array SHALL contain an entry with `server` set to the ACR login server and `identity` set to `'system'`, with no `username` or `passwordSecretRef` fields
