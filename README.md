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
