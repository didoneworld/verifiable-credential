const express = require('express');
const { resolve } = require('@vc-platform/did-client');

const app = express();
app.get('/v1/dids/:did', async (req, res) => {
  try {
    const decodedDid = decodeURIComponent(req.params.did);
    const doc = await resolve(decodedDid);
    res.json(doc);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

const port = Number(process.env.DID_RESOLVER_PORT || 4003);
app.listen(port, () => console.log(`did-resolver listening on ${port}`));
