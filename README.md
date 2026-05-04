# VC Platform (W3C-Aligned Foundation)

This monorepo now replaces raw JSON signatures with a W3C-aligned flow using `@digitalbazaar/vc`, Ed25519Signature2020 suites, JSON-LD contexts, DID-based issuer identifiers, and StatusList2021-style revocation metadata.

## What changed
- Replaced manual `tweetnacl` signing with `@digitalbazaar/vc` issue/verify APIs.
- Added `did:key` + `did:web` resolution support in `packages/did-client`.
- Added StatusList2021 credential status shape during issuance and verifier status checks.
- Added VP verification endpoint with `challenge` and `domain` matching.

## Services
- issuer-service: `POST /v1/credentials/issue`, `POST /v1/credentials/revoke`, `GET /v1/status-lists/:id`
- verifier-service: `POST /v1/credentials/verify`, `POST /v1/presentations/verify`

## Run
1. `cp .env.example .env`
2. Populate DID + multibase keys
3. `docker-compose up --build`

## Limitations
- OID4VCI / OID4VP are not fully implemented yet; current endpoints provide stepping stones.
- Status list is in-memory and represented as a credential-like resource for migration to full StatusList2021 bitstring encoding.
- DID:web trust policy and allowlisting is minimal and should be expanded before production.
