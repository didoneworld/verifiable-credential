function validateIssuePayload(body) {
  if (!body || typeof body !== 'object') return 'Request body is required.';
  if (!Array.isArray(body.type) || body.type.length === 0) return 'type must be a non-empty array.';
  if (!body.credentialSubject || typeof body.credentialSubject !== 'object') {
    return 'credentialSubject must be an object.';
  }
  return null;
}

module.exports = { validateIssuePayload };
