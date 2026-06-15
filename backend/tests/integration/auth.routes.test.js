/**
 * Integration Tests — Auth Routes
 * Uses Supertest to exercise the full Express stack against real route handlers.
 * MongoDB calls are mocked so no real DB connection is needed.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');

// ── Mock heavy dependencies before loading app ─────────────────────────────
jest.mock('mongoose', () => {
  const mMongoose = {
    connect: jest.fn().mockResolvedValue({}),
    Schema: class {
      constructor() {}
      pre() { return this; }
      methods = {};
    },
    model: jest.fn().mockReturnValue(function MockModel(data) {
      return { ...data, _id: 'mock-id', save: jest.fn().mockResolvedValue(true) };
    })
  };
  mMongoose.Schema.Types = { String: String };
  return mMongoose;
});

jest.mock('../../src/models/user.model');
jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
}));

const User = require('../../src/models/user.model');
const app = require('../../src/index');

const SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';

function makeToken(userId) {
  return jwt.sign({ userId }, SECRET, { expiresIn: '15m' });
}

// ── POST /api/auth/login ───────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  afterEach(() => jest.clearAllMocks());

  test('200 — demo credentials succeed without DB', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teamdsa@gmail.com', password: 'teamdsa' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.role).toBe('demo');
  });

  test('401 — unknown user', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@pulse.io', password: 'pass' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  test('401 — wrong password', async () => {
    User.findOne.mockResolvedValue({
      isGoogleUser: false,
      comparePassword: jest.fn().mockResolvedValue(false)
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@pulse.io', password: 'wrong' });

    expect(res.status).toBe(401);
  });
});

// ── POST /api/auth/register ────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  afterEach(() => jest.clearAllMocks());

  test('201 — creates a new user', async () => {
    User.findOne.mockResolvedValue(null);
    const fakeUser = {
      _id: 'new-id',
      username: 'TestUser',
      email: 'test@pulse.io',
      role: null,
      refreshToken: null,
      save: jest.fn().mockResolvedValue(true)
    };
    User.mockImplementation(() => fakeUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'TestUser', email: 'test@pulse.io', password: 'secure123' });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
  });

  test('400 — duplicate user', async () => {
    User.findOne.mockResolvedValue({ email: 'test@pulse.io' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'TestUser', email: 'test@pulse.io', password: 'secure123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('User already exists');
  });
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  afterEach(() => jest.clearAllMocks());

  test('401 — no token returns Unauthorized', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('200 — valid token returns demo user', async () => {
    const token = makeToken('demo-user');
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('teamdsa@gmail.com');
  });

  test('404 — valid token but user not in DB', async () => {
    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });
    const token = makeToken('real-user-id');
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// ── GET /health ────────────────────────────────────────────────────────────
describe('GET /health', () => {
  test('200 — returns ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
