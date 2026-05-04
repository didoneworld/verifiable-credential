# VC Platform Monorepo

Production-oriented foundation for a Verifiable Credential (VC) platform using Node.js, Express, and npm workspaces.

## Architecture

- `services/issuer-service`: Issues and revokes credentials.
- `services/verifier-service`: Verifies credential signatures and revocation status.
- `services/did-resolver`: Stub DID resolver service for future DID-method integrations.
- `services/revocation-service`: Optional revocation abstraction service.
- `packages/vc-core`: Shared Ed25519 signing and verification logic.
- `packages/did-client`: DID resolution client stub.
- `packages/config`: Shared environment/config helpers.
- `api-spec/openapi.yaml`: API contract for issue/revoke/verify.

Layered design is enforced in each service (`routes -> services -> utils`) to keep controllers thin and business logic centralized.

## Security Notes

- No private key hardcoding; keys come from environment variables.
- Input validation is applied on all public routes.
- Credential proof is removed before verification.
- Revocation checks are mandatory in verification flow.

## Setup

1. Copy env template:
   ```bash
   cp .env.example .env
   ```
2. Populate keys (`ISSUER_PRIVATE_KEY_BASE64`, `ISSUER_PUBLIC_KEY_BASE64`).
3. Install dependencies locally (optional if running only Docker):
   ```bash
   npm install
   ```

## Run

```bash
docker-compose up --build
```

- Issuer service: `http://localhost:4001`
- Verifier service: `http://localhost:4002`

## API Examples

Issue:
```bash
curl -X POST http://localhost:4001/v1/credentials/issue \
  -H "Content-Type: application/json" \
  -d '{"type":["EmployeeCredential"],"credentialSubject":{"id":"did:example:alice","employeeId":"E-42"}}'
```

Revoke:
```bash
curl -X POST http://localhost:4001/v1/credentials/revoke \
  -H "Content-Type: application/json" \
  -d '{"id":"<credential-id>"}'
```

Verify:
```bash
curl -X POST http://localhost:4002/v1/credentials/verify \
  -H "Content-Type: application/json" \
  -d '{"credential":{...}}'
```

## Known Limitations / Planned Upgrades

- Uses JSON stringify canonicalization (placeholder for JSON-LD canonicalization).
- DID resolution is map/env based (placeholder for full DID resolver and method drivers).
- Proof object is simplified (future: W3C VC Data Model and suites).
- In-memory revocation storage (future: durable DB and status list credential support).
- Container deployment via docker-compose only (future: Kubernetes manifests and Helm).
