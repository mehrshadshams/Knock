## ADDED Requirements

### Requirement: Container Apps Environment
The Bicep template SHALL define an Azure Container Apps Environment that provides the runtime for the Container App.

#### Scenario: Environment provisioned
- **WHEN** the Bicep template is deployed
- **THEN** a Container Apps Environment SHALL be created in the specified Azure region

### Requirement: Container App definition
The Bicep template SHALL define a Container App that runs the WebRTC signaling server container.

#### Scenario: Container App uses image from ACR
- **WHEN** the Container App is deployed or updated
- **THEN** it SHALL pull the image from the ACR login server using the specified image tag

#### Scenario: PORT environment variable injected
- **WHEN** the Container App starts a container replica
- **THEN** the environment variable `PORT=80` SHALL be injected so the Node.js server listens on the correct port

#### Scenario: Minimum one replica always running
- **WHEN** the Container App is configured
- **THEN** `minReplicas` SHALL be set to `1` to prevent cold starts for real-time WebSocket connections

### Requirement: External HTTPS ingress
The Container App SHALL be configured with external ingress so the application is reachable from the public internet over HTTPS.

#### Scenario: Ingress enabled with external traffic
- **WHEN** the Container App ingress is configured
- **THEN** `external` SHALL be `true`, `targetPort` SHALL match the container's `PORT`, and `transport` SHALL be `http` (HTTP/1.1 to support WebSocket upgrades)

#### Scenario: Public URL is available after deployment
- **WHEN** the Container App is successfully deployed
- **THEN** a public FQDN ending in `azurecontainerapps.io` SHALL be available and return HTTP 200 for the root path

#### Scenario: HTTPS enforced
- **WHEN** a request is made to the app over plain HTTP
- **THEN** Azure Container Apps SHALL redirect the request to HTTPS
