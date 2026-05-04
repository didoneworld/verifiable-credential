const { randomUUID } = require('crypto');
const { issueCredential, buildKeyPairFromMultibase } = require('@vc-platform/vc-core');
const { registerCredential, revokeCredential, getStatusListCredential } = require('./statusListStore');

async function issue(payload, config) {
  const credentialId = `urn:uuid:${randomUUID()}`;
  const statusListIndex = registerCredential(credentialId);

  const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/vc/status-list/2021/v1'],
    id: credentialId,
    type: ['VerifiableCredential', ...(payload.type || ['GenericCredential'])],
    issuer: config.issuerId,
    issuanceDate: new Date().toISOString(),
    credentialSubject: payload.credentialSubject,
    credentialStatus: {
      id: `${config.statusListBaseUrl}/default#${statusListIndex}`,
      type: 'StatusList2021Entry',
      statusPurpose: 'revocation',
      statusListIndex,
      statusListCredential: `${config.statusListBaseUrl}/default`
    }
  };

  const keyPair = buildKeyPairFromMultibase(config.keyMaterial);
  return issueCredential({ credential, keyPair });
}

function revoke(credentialId) {
  const result = revokeCredential(credentialId);
  if (!result.found) return { revoked: false, reason: 'Credential not found.' };
  return { revoked: true, credentialId, statusListIndex: result.index };
}

function getStatusList(baseUrl, listId) {
  return getStatusListCredential(baseUrl, listId);
}

module.exports = { issue, revoke, getStatusList };
