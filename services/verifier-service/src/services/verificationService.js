const axios = require('axios');
const { verifyCredential } = require('@vc-platform/vc-core');

async function verifyVc(credential) {
  const result = await verifyCredential({ credential });
  if (!result.verified) return { valid: false, reason: 'Verification failed', details: result };

  const status = credential.credentialStatus;
  if (status?.statusListCredential && status.statusListIndex) {
    const { data } = await axios.get(status.statusListCredential, { timeout: 5000 });
    const entry = data?.credentialSubject?.entries?.[status.statusListIndex];
    if (entry?.revoked) return { valid: false, reason: 'Credential revoked.' };
  }

  return { valid: true };
}

function verifyVpEnvelope({ presentation, challenge, domain }) {
  if (!presentation?.proof) return 'Presentation proof is required.';
  if (presentation.proof.challenge !== challenge) return 'Challenge mismatch.';
  if (presentation.proof.domain !== domain) return 'Domain mismatch.';
  return null;
}

module.exports = { verifyVc, verifyVpEnvelope };
