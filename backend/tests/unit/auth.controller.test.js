/**
 * Unit Tests — Auth Controller
 * Mocks Mongoose User model and fetch to test controller logic in isolation.
 */
const jwt = require('jsonwebtoken');

// ── Mock dependencies ──────────────────────────────────────────────────────
jest.mock('../../src/models/user.model');
jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
}));

const User = require('../../src/models/user.model');
const authController = require('../../src/controllers/auth.controller');

// ── Helpers ────────────────────────────────────────────────────────────────
function makeRes() {
  const res = {
    statusCode: 200,
    _body: null,
    _cookie: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this._body = body; return this; },
    cookie(name, value, opts) { this._cookie = { name, value }; return this; },
    clearCookie(name) { this._cookie = null; return this; }
  };
  return res;
}

// ── login ──────────────────────────────────────────────────────────────────
describe('authController.login', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 200 and accessToken for demo credentials', async () => {
    const req = { body: { email: 'teamdsa@gmail.com', password: 'teamdsa' } };
    const res = makeRes();

    await authController.login(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._body.accessToken).toBeDefined();
    expect(res._body.user.email).toBe('teamdsa@gmail.com');
  });

  test('returns 401 when user is not found', async () => {
    User.findOne.mockResolvedValue(null);
    const req = { body: { email: 'nobody@example.com', password: 'pass' } };
    const res = makeRes();

    await authController.login(req, res);

    expect(res.statusCode).toBe(401);
    expect(res._body.message).toBe('Invalid credentials');
  });

  test('returns 400 when account uses Google sign-in', async () => {
    User.findOne.mockResolvedValue({ isGoogleUser: true });
    const req = { body: { email: 'google@example.com', password: 'pass' } };
    const res = makeRes();

    await authController.login(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._body.message).toMatch(/Google sign-in/i);
  });

  test('returns 401 when password does not match', async () => {
    User.findOne.mockResolvedValue({
      isGoogleUser: false,
      comparePassword: jest.fn().mockResolvedValue(false)
    });
    const req = { body: { email: 'user@example.com', password: 'wrong' } };
    const res = makeRes();

    await authController.login(req, res);

    expect(res.statusCode).toBe(401);
    expect(res._body.message).toBe('Invalid credentials');
  });

  test('returns 200 with token on successful login', async () => {
    const fakeUser = {
      _id: 'abc123',
      username: 'Alice',
      email: 'alice@example.com',
      role: 'shopkeeper',
      isGoogleUser: false,
      refreshToken: null,
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true)
    };
    User.findOne.mockResolvedValue(fakeUser);
    const req = { body: { email: 'alice@example.com', password: 'correct' } };
    const res = makeRes();

    await authController.login(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._body.accessToken).toBeDefined();
    expect(res._body.user.username).toBe('Alice');
  });
});

// ── register ───────────────────────────────────────────────────────────────
describe('authController.register', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns 400 when user already exists', async () => {
    User.findOne.mockResolvedValue({ email: 'taken@example.com' });
    const req = { body: { username: 'Alice', email: 'taken@example.com', password: 'pass123' } };
    const res = makeRes();

    await authController.register(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._body.message).toBe('User already exists');
  });

  test('creates user and returns 201 with accessToken', async () => {
    User.findOne.mockResolvedValue(null);
    const fakeUser = {
      _id: 'newid',
      username: 'Bob',
      email: 'bob@example.com',
      role: null,
      refreshToken: null,
      save: jest.fn().mockResolvedValue(true)
    };
    User.mockImplementation(() => fakeUser);

    const req = { body: { username: 'Bob', email: 'bob@example.com', password: 'pass123' } };
    const res = makeRes();

    await authController.register(req, res);

    expect(res.statusCode).toBe(201);
    expect(res._body.accessToken).toBeDefined();
    expect(res._body.user.username).toBe('Bob');
  });
});

// ── getMe ──────────────────────────────────────────────────────────────────
describe('authController.getMe', () => {
  afterEach(() => jest.clearAllMocks());

  test('returns demo user object for demo userId', async () => {
    const req = { user: { userId: 'demo-user' } };
    const res = makeRes();

    await authController.getMe(req, res);

    expect(res._body.email).toBe('teamdsa@gmail.com');
    expect(res._body.role).toBe('demo');
  });

  test('returns 404 when user not found in DB', async () => {
    User.findById = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const req = { user: { userId: 'missing-id' } };
    const res = makeRes();

    await authController.getMe(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._body.message).toBe('User not found');
  });
});
