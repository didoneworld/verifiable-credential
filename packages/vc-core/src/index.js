const vc = require('@digitalbazaar/vc');
const { Ed25519Signature2020 } = require('@digitalbazaar/ed25519-signature-2020');
const { Ed25519VerificationKey2020 } = require('@digitalbazaar/ed25519-verification-key-2020');

async function issueCredential({ credential, keyPair, documentLoader }) {
  const suite = new Ed25519Signature2020({ key: keyPair });
  return vc.issue({ credential, suite, documentLoader });
}

async function verifyCredential({ credential, documentLoader }) {
  return vc.verifyCredential({
    credential,
    suite: [new Ed25519Signature2020()],
    documentLoader,
    checkStatus: async ({ credential }) => {
      if (!credential.credentialStatus) return { verified: true };
      return { verified: true };
    }
  });
}

function buildKeyPairFromMultibase({ id, controller, publicKeyMultibase, privateKeyMultibase }) {
  return new Ed25519VerificationKey2020({
    id,
    controller,
    publicKeyMultibase,
    privateKeyMultibase
  });
}

module.exports = { issueCredential, verifyCredential, buildKeyPairFromMultibase };
