const express = require('express');

const app = express();
app.use(express.json());

const store = new Map();

app.post('/v1/revocations', (req, res) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id is required' });
  store.set(id, { revoked: true, revokedAt: new Date().toISOString() });
  res.json({ id, revoked: true });
});

app.get('/v1/revocations/:id', (req, res) => {
  res.json({ id: req.params.id, ...(store.get(req.params.id) || { revoked: false }) });
});

const port = Number(process.env.REVOCATION_SERVICE_PORT || 4004);
app.listen(port, () => console.log(`revocation-service listening on ${port}`));
