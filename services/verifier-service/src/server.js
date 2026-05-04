const express = require('express');
const { getRequiredEnv } = require('@vc-platform/config');
const { createVerificationRouter } = require('./routes/verificationRoutes');

const app = express();
app.use(express.json({ limit: '1mb' }));

const config = {
  issuerBaseUrl: getRequiredEnv('ISSUER_BASE_URL')
};

app.use(createVerificationRouter(config));

app.use((error, req, res, next) => {
  console.error('[verifier-service] error:', error.message);
  res.status(500).json({ valid: false, reason: 'Internal server error.' });
});

const port = Number(process.env.VERIFIER_SERVICE_PORT || 4002);
app.listen(port, () => {
  console.log(`verifier-service listening on port ${port}`);
});
