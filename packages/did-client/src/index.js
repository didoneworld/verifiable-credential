const { driver } = require('@digitalbazaar/did-method-key');
const axios = require('axios');

const didKeyDriver = driver();

async function resolveDidKey(did) {
  return didKeyDriver.get({ did });
}

async function resolveDidWeb(did) {
  const didPath = did.replace('did:web:', '').split(':');
  const domain = didPath.shift();
  const path = didPath.length ? `/${didPath.join('/')}` : '';
  const url = `https://${domain}${path}/did.json`;
  const { data } = await axios.get(url, { timeout: 5000 });
  return data;
}

async function resolve(did) {
  if (did.startsWith('did:key:')) return resolveDidKey(did);
  if (did.startsWith('did:web:')) return resolveDidWeb(did);
  throw new Error(`Unsupported DID method for ${did}`);
}

module.exports = { resolve };
