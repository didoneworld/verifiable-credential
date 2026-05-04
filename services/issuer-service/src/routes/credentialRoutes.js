const express = require('express');
const { issue, revoke, getStatusList } = require('../services/credentialService');

function createCredentialRouter(config) {
  const router = express.Router();

  router.post('/v1/credentials/issue', async (req, res, next) => {
    try {
      const result = await issue(req.body, config);
      res.status(201).json(result);
    } catch (e) { next(e); }
  });

  router.post('/v1/credentials/revoke', async (req, res, next) => {
    try { res.json(revoke(req.body.id)); } catch (e) { next(e); }
  });

  router.get('/v1/status-lists/:id', async (req, res, next) => {
    try { res.json(getStatusList(req.params.id)); } catch (e) { next(e); }
  });

  return router;
}
module.exports = { createCredentialRouter };
