## ADDED Requirements

### Requirement: GitHub Actions deploy workflow
The repository SHALL include a GitHub Actions workflow file at `.github/workflows/deploy.yml` that automatically builds, pushes, and deploys the application on every push to the `main` branch.

#### Scenario: Workflow triggers on push to main
- **WHEN** a commit is pushed to the `main` branch
- **THEN** the GitHub Actions workflow SHALL start automatically

#### Scenario: Azure login via service principal
- **WHEN** the workflow runs
- **THEN** it SHALL authenticate to Azure using a service principal stored in the `AZURE_CREDENTIALS` GitHub Actions secret

#### Scenario: Docker image built and pushed to ACR
- **WHEN** the workflow runs
- **THEN** it SHALL build the Docker image from the repository root and push it to ACR tagged with `latest` and the short Git SHA

#### Scenario: Container App updated to new image
- **WHEN** the image push succeeds
- **THEN** the workflow SHALL run `az containerapp update` to set the Container App's image to the newly pushed tag, triggering a rolling deployment

#### Scenario: Workflow fails on build error
- **WHEN** the `docker build` step fails
- **THEN** the workflow SHALL stop and not push the broken image or update the Container App

### Requirement: Required GitHub Actions secrets documented
The `README.md` SHALL document all GitHub Actions secrets required for the CI/CD pipeline.

#### Scenario: Secrets list in README
- **WHEN** a developer reads the README deployment section
- **THEN** they SHALL find a list of all required secrets: `AZURE_CREDENTIALS`, `ACR_LOGIN_SERVER`, `ACR_USERNAME`, `ACR_PASSWORD`, `AZURE_RESOURCE_GROUP`, `CONTAINER_APP_NAME`

### Requirement: One-time infrastructure setup documented
The `README.md` SHALL include step-by-step instructions for provisioning the Azure infrastructure and configuring GitHub secrets for the first time.

#### Scenario: README deployment section present
- **WHEN** a developer reads the README
- **THEN** they SHALL find commands to: log in to Azure CLI, deploy the Bicep template, retrieve ACR credentials, and create the required GitHub secrets
