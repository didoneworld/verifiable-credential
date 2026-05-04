const revokedCredentials = new Map();

function revokeCredential(credentialId) {
  revokedCredentials.set(credentialId, {
    revoked: true,
    revokedAt: new Date().toISOString()
  });
}

function getRevocationStatus(credentialId) {
  return revokedCredentials.get(credentialId) || { revoked: false };
}

module.exports = { revokeCredential, getRevocationStatus };
