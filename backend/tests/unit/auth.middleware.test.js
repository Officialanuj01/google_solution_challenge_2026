/**
 * Unit Tests — Auth Middleware
 * Tests JWT verification logic in isolation.
 */
const jwt = require('jsonwebtoken');
const authMiddleware = require('../../src/middleware/auth.middleware');

const SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';

function makeReqRes(authHeader) {
  const req = { headers: { authorization: authHeader } };
  const res = {
    statusCode: 200,
    _body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this._body = body; return this; }
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('authMiddleware', () => {
  test('calls next() and attaches user for a valid token', () => {
    const token = jwt.sign({ userId: 'user-123' }, SECRET, { expiresIn: '15m' });
    const { req, res, next } = makeReqRes(`Bearer ${token}`);

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ userId: 'user-123' });
  });

  test('returns 401 when Authorization header is missing', () => {
    const { req, res, next } = makeReqRes(undefined);

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res._body.message).toBe('Access token required');
  });

  test('returns 401 when header does not start with Bearer', () => {
    const { req, res, next } = makeReqRes('Token some-token');

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  test('returns 401 for a tampered / invalid token', () => {
    const { req, res, next } = makeReqRes('Bearer invalidtoken.abc.xyz');

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res._body.message).toBe('Invalid token');
  });

  test('returns 401 with "Token expired" for an expired token', () => {
    const token = jwt.sign({ userId: 'user-123' }, SECRET, { expiresIn: -1 });
    const { req, res, next } = makeReqRes(`Bearer ${token}`);

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res._body.message).toBe('Token expired');
  });
});
