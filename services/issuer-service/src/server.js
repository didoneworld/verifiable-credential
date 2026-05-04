const express = require('express');
const { getRequiredEnv } = require('@vc-platform/config');
const { createCredentialRouter } = require('./routes/credentialRoutes');

const app = express();
app.use(express.json({ limit: '1mb' }));

const config = {
  issuerId: getRequiredEnv('ISSUER_ID'),
  privateKeyBase64: getRequiredEnv('ISSUER_PRIVATE_KEY_BASE64')
};

app.use(createCredentialRouter(config));

app.use((error, req, res, next) => {
  console.error('[issuer-service] error:', error.message);
  res.status(500).json({ error: 'Internal server error.' });
});

const port = Number(process.env.ISSUER_SERVICE_PORT || 4001);
app.listen(port, () => {
  console.log(`issuer-service listening on port ${port}`);
});
