const axios = require('axios');
const { verifyCredential } = require('@vc-platform/vc-core');

function validatePresentation(presentation, challenge, domain) {
  if (!presentation || !presentation.proof) return 'Presentation proof is required.';
  if (presentation.proof.challenge !== challenge) return 'Challenge mismatch.';
  if (presentation.proof.domain !== domain) return 'Domain mismatch.';
  return null;
}

async function verifyVc(credential, config) {
  const result = await verifyCredential({ credential, documentLoader: config.documentLoader });
  if (!result.verified) return { valid: false, reason: 'Linked data proof verification failed.' };

  const cs = credential.credentialStatus;
  if (cs?.type === 'StatusList2021Entry') {
    const { data } = await axios.get(cs.statusListCredential, { timeout: 5000 });
    const entry = data.entries?.[cs.statusListIndex];
    if (entry?.revoked) return { valid: false, reason: 'Credential revoked by StatusList2021.' };
  }
  return { valid: true };
}

module.exports = { verifyVc, validatePresentation };
