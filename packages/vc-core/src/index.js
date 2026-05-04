const nacl = require('tweetnacl');

function canonicalize(payload) {
  // Placeholder canonicalization strategy. Upgrade path: JSON-LD normalization.
  return JSON.stringify(payload);
}

function decodeBase64(base64Value, label) {
  try {
    return Buffer.from(base64Value, 'base64');
  } catch (error) {
    throw new Error(`Invalid base64 input for ${label}.`);
  }
}

function sign(payload, privateKeyBase64) {
  const canonicalPayload = canonicalize(payload);
  const message = Buffer.from(canonicalPayload, 'utf8');
  const privateKey = decodeBase64(privateKeyBase64, 'privateKey');

  if (privateKey.length !== nacl.sign.seedLength) {
    throw new Error('Ed25519 private key must be a 32-byte seed encoded in base64.');
  }

  const keyPair = nacl.sign.keyPair.fromSeed(new Uint8Array(privateKey));
  const signature = nacl.sign.detached(new Uint8Array(message), keyPair.secretKey);
  return Buffer.from(signature).toString('base64');
}

function verify(payload, signatureBase64, publicKeyBase64) {
  const canonicalPayload = canonicalize(payload);
  const message = Buffer.from(canonicalPayload, 'utf8');
  const signature = decodeBase64(signatureBase64, 'signature');
  const publicKey = decodeBase64(publicKeyBase64, 'publicKey');

  if (publicKey.length !== nacl.sign.publicKeyLength) {
    throw new Error('Ed25519 public key must be 32 bytes encoded in base64.');
  }

  return nacl.sign.detached.verify(
    new Uint8Array(message),
    new Uint8Array(signature),
    new Uint8Array(publicKey)
  );
}

module.exports = {
  canonicalize,
  sign,
  verify
};
