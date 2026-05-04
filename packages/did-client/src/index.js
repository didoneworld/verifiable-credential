function parseDidMap(rawMap) {
  if (!rawMap) return {};

  try {
    return JSON.parse(rawMap);
  } catch (error) {
    throw new Error('DID_PUBLIC_KEY_MAP must be a valid JSON object string.');
  }
}

async function resolve(did, options = {}) {
  const didMap = options.didMap || parseDidMap(process.env.DID_PUBLIC_KEY_MAP);
  const resolvedPublicKey = didMap[did] || process.env.ISSUER_PUBLIC_KEY_BASE64;

  if (!resolvedPublicKey) {
    throw new Error(`No public key found for DID: ${did}`);
  }

  return {
    did,
    publicKeyBase64: resolvedPublicKey,
    source: didMap[did] ? 'did-map' : 'fallback-env'
  };
}

module.exports = {
  resolve
};
