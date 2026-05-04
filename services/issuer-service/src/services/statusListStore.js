const statusEntries = new Map();

function allocateStatus(credentialId) {
  const index = String(statusEntries.size);
  statusEntries.set(index, { credentialId, revoked: false });
  return index;
}

function revokeStatusByCredentialId(credentialId) {
  for (const [index, item] of statusEntries.entries()) {
    if (item.credentialId === credentialId) {
      statusEntries.set(index, { ...item, revoked: true, revokedAt: new Date().toISOString() });
      return index;
    }
  }
  return null;
}

function getStatusByIndex(index) { return statusEntries.get(index); }
function snapshot() { return Object.fromEntries(statusEntries); }

module.exports = { allocateStatus, revokeStatusByCredentialId, getStatusByIndex, snapshot };
