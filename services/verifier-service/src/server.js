const express = require('express');
const { createVerificationRouter } = require('./routes/verificationRoutes');

const app = express();
app.use(express.json());
app.use(createVerificationRouter());
app.use((error, req, res, next) => res.status(500).json({ valid: false, reason: error.message }));

app.listen(Number(process.env.VERIFIER_SERVICE_PORT || 4002), () => {
  console.log('W3C verifier-service listening on 4002');
});
