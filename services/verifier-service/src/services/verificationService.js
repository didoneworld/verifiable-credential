const axios = require('axios');
const { verify } = require('@vc-platform/vc-core');
const { resolve } = require('@vc-platform/did-client');

async function verifyCredential(credential, config) {
  const { proof, ...unsignedCredential } = credential;

  const didDocument = await resolve(unsignedCredential.issuer);
  const signatureValid = verify(unsignedCredential, proof.jws, didDocument.publicKeyBase64);
  if (!signatureValid) {
    return { valid: false, reason: 'Invalid credential signature.' };
  }

  const revocationUrl = `${config.issuerBaseUrl}/v1/revocation/${encodeURIComponent(unsignedCredential.id)}`;
  const { data: revocationStatus } = await axios.get(revocationUrl, { timeout: 3000 });
  if (revocationStatus.revoked) {
    return { valid: false, reason: 'Credential has been revoked.' };
  }

  return { valid: true };
}

module.exports = { verifyCredential };
