const vc = require('@digitalbazaar/vc');
const { driver } = require('@digitalbazaar/did-method-key');

const didKey = driver();

async function documentLoader(url) {
  if (url.startsWith('did:key:')) {
    const document = await didKey.get({ did: url });
    return { contextUrl: null, documentUrl: url, document };
  }
  return vc.defaultDocumentLoader(url);
}

module.exports = { documentLoader };
