const express = require('express');
const { getRequiredEnv } = require('@vc-platform/config');
const { createCredentialRouter } = require('./routes/credentialRoutes');

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
  }
};

app.use(createCredentialRouter(config));
app.use((error, req, res, next) => res.status(500).json({ error: error.message }));

app.listen(Number(process.env.ISSUER_SERVICE_PORT || 4001), () => {
  console.log('W3C issuer-service listening on 4001');
});
