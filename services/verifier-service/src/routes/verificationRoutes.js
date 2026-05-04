const express = require('express');
const { verifyVc, verifyVpEnvelope } = require('../services/verificationService');

function createVerificationRouter() {
  const router = express.Router();

  router.post('/v1/credentials/verify', async (req, res, next) => {
    try {
      const credential = req.body?.vc || req.body?.credential;
      if (!credential) return res.status(400).json({ valid: false, reason: 'vc is required.' });
      return res.json(await verifyVc(credential));
    } catch (error) { return next(error); }
  });

  router.post('/v1/presentations/verify', async (req, res, next) => {
    try {
      const envelopeError = verifyVpEnvelope(req.body);
      if (envelopeError) return res.status(400).json({ valid: false, reason: envelopeError });
      for (const credential of req.body.presentation.verifiableCredential || []) {
        const result = await verifyVc(credential);
        if (!result.valid) return res.status(400).json(result);
      }
      return res.json({ valid: true });
    } catch (error) { return next(error); }
  });

  return router;
}

module.exports = { createVerificationRouter };
