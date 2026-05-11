## ADDED Requirements

### Requirement: Azure Container Registry resource
The Bicep template SHALL define an Azure Container Registry resource for storing and serving the application's Docker image.

#### Scenario: ACR provisioned with Basic SKU
- **WHEN** the Bicep template is deployed
- **THEN** an ACR resource SHALL be created with SKU `Basic` in the same resource group as the Container App

#### Scenario: Admin account enabled
- **WHEN** the ACR is provisioned
- **THEN** the admin account SHALL be enabled so that credentials can be retrieved and stored as GitHub Actions secrets

### Requirement: Image push to ACR
The CI/CD pipeline SHALL authenticate to ACR and push the built Docker image on every successful build.

#### Scenario: Image tagged with Git SHA
- **WHEN** the GitHub Actions workflow builds the image
- **THEN** the image SHALL be tagged with both `latest` and the short Git commit SHA (e.g., `webrtc-call:abc1234`)

#### Scenario: Image push succeeds
- **WHEN** the workflow runs `docker push`
- **THEN** the image SHALL be available in ACR and referenceable by the Container App
