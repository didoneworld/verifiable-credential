const { v4: uuidv4 } = require('uuid');
const { issueCredential, buildKeyPairFromMultibase } = require('@vc-platform/vc-core');
const { allocateStatus, revokeStatusByCredentialId, snapshot } = require('./statusListStore');

function buildUnsignedCredential(payload, config, statusListIndex) {
  return {
    '@context': ['https://www.w3.org/2018/credentials/v1', 'https://w3id.org/vc/status-list/2021/v1'],
    id: `urn:uuid:${uuidv4()}`,
    type: ['VerifiableCredential', ...payload.type],
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
}

async function issue(payload, config) {
  const statusListIndex = allocateStatus('pending');
  const credential = buildUnsignedCredential(payload, config, statusListIndex);
  const keyPair = buildKeyPairFromMultibase(config.keyMaterial);
  const signed = await issueCredential({ credential, keyPair, documentLoader: config.documentLoader });
  revokeStatusByCredentialId('pending');
  return signed;
}

function revoke(credentialId) {
  const index = revokeStatusByCredentialId(credentialId);
  if (index === null) return { revoked: false, reason: 'Credential not found in status list.' };
  return { revoked: true, credentialId, statusListIndex: index };
}

function getStatusList(listId) {
  return {
    id: `${process.env.STATUS_LIST_BASE_URL || ''}/${listId}`,
    type: ['VerifiableCredential', 'StatusList2021Credential'],
    statusPurpose: 'revocation',
    entries: snapshot()
  };
}

module.exports = { issue, revoke, getStatusList };
