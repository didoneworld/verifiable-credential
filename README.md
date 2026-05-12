# VC Platform (W3C VC Data Integrity Baseline)

This repository now uses a W3C-aligned VC stack powered by Digital Bazaar libraries.

## Core upgrades
- Replaced manual signing flow with `@digitalbazaar/vc` issue/verify.
- Added shared `documentLoader` in `packages/vc-core/documentLoader.js`.
- DID support includes `did:key` (default via loader) and `did:web` in `did-client`.
- Issuer now emits VC with `StatusList2021Entry` metadata.
- Verifier checks linked-data proofs and status-list revocation.
- VP endpoint validates `challenge` and `domain`.

## Endpoints
- Issuer: `POST /v1/credentials/issue`, `POST /v1/credentials/revoke`, `GET /v1/status-lists/:id`
- Verifier: `POST /v1/credentials/verify`, `POST /v1/presentations/verify`

## Run
```bash
cp .env.example .env
docker-compose up --build
```

## Next production steps
- Full StatusList2021 bitstring encoding.
- OID4VCI / OID4VP protocol endpoints.
- KMS/HSM-backed key operations.
- Trust registry and DID:web policy hardening.

---
## Platform Integration

This repository is a standalone component of the DID One World unified identity platform.

### Platform Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│            DID One World Platform                  │
├─────────────────────────────────────────────────┤
│  idwallet     →  Agent-DID  →  verifiable-cred │
│  (Wallet)       (Identity)     (Credentials)    │
└─────────────────────────────────────────────┘
```

### Component Role

| Component | Provides |
|-----------|----------|
| **Agent-DID** | Agent identity registry, lifecycle management, blueprints |
| **verifiable-credential** (this repo) | Credential issuance, verification, revocation |
| **idwallet** | User wallet, credential storage, presentation |

### Standalone Usage

This repo can be run independently:

```bash
cp .env.example .env
docker-compose up --build
```

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /v1/credentials/issue` | Issue credential |
| `POST /v1/credentials/verify` | Verify credential |
| `POST /v1/credentials/revoke` | Revoke credential |
| `POST /v1/presentations/verify` | Verify presentation |
| `GET /v1/status-lists/:id` | Get status list |

### Integration Points

When integrated with platform:
- Agent identity from `Agent-DID` repo
- Wallet from `idwallet` repo
- Full platform at [didoneworld/platform](https://github.com/didoneworld/platform)
