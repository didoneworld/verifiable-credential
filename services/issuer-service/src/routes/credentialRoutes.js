const express = require('express');
const { validateIssuePayload } = require('../utils/validation');
const { issueCredential, revoke, getRevocation } = require('../services/credentialService');

function createCredentialRouter(config) {
  const router = express.Router();

  router.post('/v1/credentials/issue', async (req, res, next) => {
    try {
      const validationError = validateIssuePayload(req.body);
      if (validationError) return res.status(400).json({ error: validationError });

      const credential = await issueCredential(req.body, config);
      return res.status(201).json(credential);
    } catch (error) {
      return next(error);
    }
  });

  router.post('/v1/credentials/revoke', async (req, res, next) => {
    try {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required.' });
      const result = await revoke(id);
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/v1/revocation/:id', async (req, res, next) => {
    try {
      const status = await getRevocation(req.params.id);
      return res.json(status);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createCredentialRouter };
