const express = require('express');
const { validateVerifyPayload } = require('../utils/validation');
const { verifyCredential } = require('../services/verificationService');

function createVerificationRouter(config) {
  const router = express.Router();

  router.post('/v1/credentials/verify', async (req, res, next) => {
    try {
      const validationError = validateVerifyPayload(req.body);
      if (validationError) return res.status(400).json({ valid: false, reason: validationError });

      const result = await verifyCredential(req.body.credential, config);
      return res.json(result);
    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(400).json({ valid: false, reason: 'Credential status unavailable.' });
      }
      return next(error);
    }
  });

  return router;
}

module.exports = { createVerificationRouter };
