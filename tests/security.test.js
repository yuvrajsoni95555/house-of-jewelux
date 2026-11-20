const test = require('node:test');
const assert = require('node:assert/strict');
const { issueAdminSession, requireAdmin, adminLoginRateLimit } = require('../server/middleware/security');

function invokeMiddleware(fn, req) {
  let nextCalled = false;
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  fn(req, res, () => { nextCalled = true; });
  return { res, nextCalled };
}

test('admin session token is accepted while valid', () => {
  const token = issueAdminSession();
  const result = invokeMiddleware(requireAdmin, { headers: { authorization: 'Bearer ' + token } });
  assert.equal(result.nextCalled, true);
  assert.equal(result.res.statusCode, 200);
});

test('missing and tampered admin tokens are rejected', () => {
  const missing = invokeMiddleware(requireAdmin, { headers: {} });
  assert.equal(missing.nextCalled, false);
  assert.equal(missing.res.statusCode, 401);
  const tampered = invokeMiddleware(requireAdmin, { headers: { authorization: 'Bearer abc.def' } });
  assert.equal(tampered.nextCalled, false);
  assert.equal(tampered.res.statusCode, 401);
});

test('admin login attempts are rate limited', () => {
  const req = { ip: 'test-rate-limit-' + Date.now(), socket: {} };
  for (let i = 0; i < 8; i++) {
    const result = invokeMiddleware(adminLoginRateLimit, req);
    assert.equal(result.nextCalled, true);
  }
  const blocked = invokeMiddleware(adminLoginRateLimit, req);
  assert.equal(blocked.nextCalled, false);
  assert.equal(blocked.res.statusCode, 429);
});
