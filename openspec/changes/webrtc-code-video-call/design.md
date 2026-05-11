## Context

There is no existing application. This design introduces a new browser-based 1:1 video calling product from scratch. Two users need to connect without accounts: one generates a short code, the other enters it, and a peer-to-peer WebRTC video/audio session is established. A lightweight signaling server is required to exchange WebRTC handshake messages.

## Goals / Non-Goals

**Goals:**
- Generate a short, human-readable session code on demand
- Support exactly two participants per session (1:1 only)
- Exchange WebRTC SDP offer/answer and ICE candidates via a WebSocket signaling server
- Render local and remote video streams in the browser
- Provide basic call controls: mute audio, toggle camera, hang up
- Work in modern browsers without plugins or installs

**Non-Goals:**
- Group calls (more than 2 participants)
- Persistent call history or recording
- User accounts, authentication, or identity
- End-to-end encryption beyond what WebRTC provides natively
- TURN server provisioning (MVP uses public STUN only; TURN is a post-MVP concern)
- Mobile native apps

## Decisions

### 1. Code Generation Strategy
**Decision**: Generate a short alphanumeric code (6 characters, e.g. `A3K9WZ`) on the server when the first user opens/requests a session.

**Rationale**: Short codes are easy to communicate verbally or via chat. Server-side generation ensures uniqueness and allows the server to track active sessions. Client-side generation risks collisions without coordination.

**Alternatives considered**:
- UUID: Too long to share verbally.
- Long random URL fragment: Works but harder to dictate; still chosen as a fallback share mechanism.

---

### 2. Signaling Transport
**Decision**: Use WebSockets (native browser WebSocket API on the client; `ws` library on the server).

**Rationale**: WebRTC requires a low-latency, bidirectional channel for SDP and ICE exchange. WebSockets are well-supported in all modern browsers and are simple to implement. Server-Sent Events are one-directional and unsuitable. Long-polling adds unnecessary complexity.

**Alternatives considered**:
- Firebase Realtime Database: Removes signaling server complexity but adds a third-party dependency and cost.
- Socket.io: Adds abstraction over WebSockets but is unnecessary for MVP scope.

---

### 3. Backend Technology
**Decision**: Node.js signaling server using the `ws` WebSocket library, served alongside static frontend files.

**Rationale**: Minimal dependencies, fast to stand up, and WebRTC signaling workloads are I/O-bound (ideal for Node.js). Session state is held in-memory (a `Map` of code → peer connections), which is sufficient for ephemeral MVP sessions.

**Alternatives considered**:
- Python (FastAPI + websockets): Viable but introduces a different runtime stack.
- Serverless WebSockets (AWS API Gateway): Operational complexity not warranted for MVP.

---

### 4. WebRTC Role Assignment (Caller/Callee)
**Decision**: The user who generates the code becomes the **offerer**; the user who enters the code becomes the **answerer**.

**Rationale**: Roles must be deterministic to avoid glare conditions (both sides creating an offer simultaneously). Tying the role to code generation is simple and transparent.

---

### 5. Frontend Architecture
**Decision**: Vanilla HTML/CSS/JavaScript with no frontend framework.

**Rationale**: The UI is minimal (two video elements + control buttons). Adding a framework (React, Vue) increases complexity without significant benefit at this scale. The existing `main.py` suggests a Python-served static file approach; the JS can be a single `main.js`.

**Alternatives considered**:
- React: Overhead not justified for a single-page, minimal-state UI.

---

### 6. ICE / NAT Traversal
**Decision**: Use Google's public STUN servers (`stun:stun.l.google.com:19302`) for MVP. TURN is a post-MVP concern.

**Rationale**: STUN resolves most peer connectivity issues (symmetric NAT is the exception). TURN servers require provisioning and cost. For MVP, public STUN is sufficient and free.

## Risks / Trade-offs

- **Symmetric NAT failure** → Calls will fail between users behind strict symmetric NAT without TURN. Mitigation: Document this limitation; add TURN support post-MVP.
- **In-memory session state** → Server restart drops all active sessions. Mitigation: Acceptable for MVP; add persistence (Redis) if needed at scale.
- **Code collisions** → Unlikely with 6-char alphanumeric (36^6 ≈ 2.1B combinations) but possible under load. Mitigation: Server checks for uniqueness before issuing a code.
- **No session expiry** → Abandoned sessions linger in memory. Mitigation: Add a TTL (e.g., 10 minutes of inactivity) to auto-clean sessions.
- **Browser compatibility** → WebRTC is broadly supported but may differ in codec negotiation. Mitigation: Test against Chrome and Firefox; rely on browser defaults for codec selection.
