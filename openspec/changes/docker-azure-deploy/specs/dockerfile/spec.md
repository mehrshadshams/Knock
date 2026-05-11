## ADDED Requirements

### Requirement: Production Docker image
The project SHALL include a `Dockerfile` at the repository root that produces a runnable container image for the Node.js signaling server.

#### Scenario: Image builds successfully
- **WHEN** `docker build -t webrtc-call .` is run from the repository root
- **THEN** the build SHALL complete without errors and produce an image

#### Scenario: Image uses minimal base
- **WHEN** the image is inspected
- **THEN** the base image SHALL be `node:22-alpine` or equivalent Alpine-based Node image

#### Scenario: Container starts and listens on PORT
- **WHEN** the container is started with `docker run -e PORT=3000 -p 3000:3000 webrtc-call`
- **THEN** the server SHALL start and respond to HTTP requests on port 3000

#### Scenario: node_modules are installed from package-lock.json
- **WHEN** the image is built
- **THEN** `npm ci --omit=dev` SHALL be used to install only production dependencies

### Requirement: .dockerignore excludes dev artefacts
The repository SHALL include a `.dockerignore` file that prevents unnecessary files from being copied into the image build context.

#### Scenario: Dev artefacts excluded
- **WHEN** the Docker image is built
- **THEN** `node_modules/`, `openspec/`, `.git/`, and `*.md` files SHALL NOT be present in the image

#### Scenario: Application files included
- **WHEN** the Docker image is built
- **THEN** `server.js`, `package.json`, `package-lock.json`, and the `public/` directory SHALL be present in the image
