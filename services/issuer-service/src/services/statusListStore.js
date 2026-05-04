const credentialsByIndex = new Map();

function registerCredential(credentialId) {
  const index = String(credentialsByIndex.size);
  credentialsByIndex.set(index, { credentialId, revoked: false, statusPurpose: 'revocation' });
  return index;
}

function revokeCredential(credentialId) {
  for (const [index, record] of credentialsByIndex.entries()) {
    if (record.credentialId === credentialId) {
      credentialsByIndex.set(index, { ...record, revoked: true, revokedAt: new Date().toISOString() });
      return { found: true, index };
    }
  }
  return { found: false };
}

function getStatusListCredential(baseUrl, listId = 'default') {
  return {
    '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/vc/status-list/2021/v1'],
    id: `${baseUrl}/${listId}`,
    type: ['VerifiableCredential', 'StatusList2021Credential'],
    issuer: process.env.ISSUER_ID,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: `${baseUrl}/${listId}#list`,
      type: 'StatusList2021',
      entries: Object.fromEntries(credentialsByIndex)
    }
  };
}

module.exports = { registerCredential, revokeCredential, getStatusListCredential };
