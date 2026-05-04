const express = require('express');
const { issue, revoke, getStatusList } = require('../services/credentialService');

function createCredentialRouter(config) {
  const router = express.Router();

  router.post('/v1/credentials/issue', async (req, res, next) => {
    try {
      if (!req.body?.credentialSubject) return res.status(400).json({ error: 'credentialSubject is required.' });
      const vc = await issue(req.body, config);
      return res.status(201).json({ vc });
    } catch (error) { return next(error); }
  });

  router.post('/v1/credentials/revoke', (req, res) => res.json(revoke(req.body?.id)));
  router.get('/v1/status-lists/:id', (req, res) => res.json(getStatusList(config.statusListBaseUrl, req.params.id)));

  return router;
}

module.exports = { createCredentialRouter };
