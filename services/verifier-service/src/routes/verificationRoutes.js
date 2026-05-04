const express = require('express');
const { verifyVc, validatePresentation } = require('../services/verificationService');

function createVerificationRouter(config) {
  const router = express.Router();
  router.post('/v1/credentials/verify', async (req, res, next) => {
    try { res.json(await verifyVc(req.body.credential, config)); } catch (e) { next(e); }
  });

  router.post('/v1/presentations/verify', async (req, res, next) => {
    try {
      const { presentation, challenge, domain } = req.body;
      const pError = validatePresentation(presentation, challenge, domain);
      if (pError) return res.status(400).json({ valid: false, reason: pError });
      const credentials = presentation.verifiableCredential || [];
      for (const credential of credentials) {
        const result = await verifyVc(credential, config);
        if (!result.valid) return res.status(400).json(result);
      }
      return res.json({ valid: true });
    } catch (e) { next(e); }
  });

  return router;
}
module.exports = { createVerificationRouter };
