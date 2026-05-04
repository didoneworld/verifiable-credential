const vc = require('@digitalbazaar/vc');
const { Ed25519Signature2020 } = require('@digitalbazaar/ed25519-signature-2020');
const { Ed25519VerificationKey2020 } = require('@digitalbazaar/ed25519-verification-key-2020');
const { documentLoader } = require('../documentLoader');

function buildKeyPairFromMultibase({ id, controller, publicKeyMultibase, privateKeyMultibase }) {
  return new Ed25519VerificationKey2020({ id, controller, publicKeyMultibase, privateKeyMultibase });
}

async function issueCredential({ credential, keyPair }) {
  return vc.issue({
    credential,
    suite: new Ed25519Signature2020({ key: keyPair }),
    documentLoader
  });
}

async function verifyCredential({ credential }) {
  return vc.verifyCredential({ credential, documentLoader, suite: [new Ed25519Signature2020()] });
}

module.exports = { buildKeyPairFromMultibase, issueCredential, verifyCredential, documentLoader };
