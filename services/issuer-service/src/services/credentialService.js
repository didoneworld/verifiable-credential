const { v4: uuidv4 } = require('uuid');
const { sign } = require('@vc-platform/vc-core');
const { revokeCredential, getRevocationStatus } = require('./revocationStore');

function buildCredential({ issuer, type, credentialSubject }) {
  return {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: uuidv4(),
    type: ['VerifiableCredential', ...type],
    issuer,
    issuanceDate: new Date().toISOString(),
    credentialSubject
  };
}

async function issueCredential(payload, config) {
  const vc = buildCredential({
    issuer: config.issuerId,
    type: payload.type,
    credentialSubject: payload.credentialSubject
  });

  const jws = sign(vc, config.privateKeyBase64);

  return {
    ...vc,
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      proofPurpose: 'assertionMethod',
      jws
    }
  };
}

async function revoke(credentialId) {
  revokeCredential(credentialId);
  return { id: credentialId, revoked: true };
}

async function getRevocation(id) {
  return { id, ...getRevocationStatus(id) };
}

module.exports = { issueCredential, revoke, getRevocation };
