const express = require('express');
const { getRequiredEnv } = require('@vc-platform/config');
const { createCredentialRouter } = require('./routes/credentialRoutes');

const staticDocs = new Map([
  ['https://www.w3.org/2018/credentials/v1', require('./utils/contexts/credentials-v1.json')],
  ['https://w3id.org/vc/status-list/2021/v1', require('./utils/contexts/status-list-2021-v1.json')]
]);

const app = express();
app.use(express.json());
const config = {
  issuerId: getRequiredEnv('ISSUER_ID'),
  statusListBaseUrl: getRequiredEnv('STATUS_LIST_BASE_URL'),
  keyMaterial: {
    id: `${getRequiredEnv('ISSUER_ID')}#key-1`,
    controller: getRequiredEnv('ISSUER_ID'),
    publicKeyMultibase: getRequiredEnv('ISSUER_PUBLIC_KEY_MULTIBASE'),
    privateKeyMultibase: getRequiredEnv('ISSUER_PRIVATE_KEY_MULTIBASE')
  },
  documentLoader: async (url) => {
    if (staticDocs.has(url)) return { documentUrl: url, document: staticDocs.get(url), contextUrl: null };
    throw new Error(`Document not found in local loader: ${url}`);
  }
};

app.use(createCredentialRouter(config));
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));
app.listen(Number(process.env.ISSUER_SERVICE_PORT || 4001));
