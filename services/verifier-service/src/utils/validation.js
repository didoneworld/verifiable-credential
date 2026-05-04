function validateVerifyPayload(body) {
  if (!body || typeof body !== 'object' || !body.credential) {
    return 'credential object is required.';
  }

  const { credential } = body;
  if (!credential.proof || !credential.proof.jws) {
    return 'credential.proof.jws is required.';
  }

  if (!credential.issuer) {
    return 'credential.issuer is required.';
  }

  return null;
}

module.exports = { validateVerifyPayload };
