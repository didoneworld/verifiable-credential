const express = require('express');
const { createVerificationRouter } = require('./routes/verificationRoutes');

const staticDocs = new Map([
  ['https://www.w3.org/2018/credentials/v1', require('../../issuer-service/src/utils/contexts/credentials-v1.json')],
  ['https://w3id.org/vc/status-list/2021/v1', require('../../issuer-service/src/utils/contexts/status-list-2021-v1.json')]
]);

const app = express();
app.use(express.json());
app.use(createVerificationRouter({
  documentLoader: async (url) => {
    if (staticDocs.has(url)) return { documentUrl: url, document: staticDocs.get(url), contextUrl: null };
    throw new Error(`Document not found in local loader: ${url}`);
  }
}));
app.use((err, req, res, next) => res.status(500).json({ valid: false, reason: err.message }));
app.listen(Number(process.env.VERIFIER_SERVICE_PORT || 4002));
