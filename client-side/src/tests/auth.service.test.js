/**
 * Unit Tests — auth.service.js
 * Mocks global fetch so no real network calls are made.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../services/auth.service';

// ── Helper to build a fake fetch response ─────────────────────────────────
function mockFetch(body, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    headers: { get: () => 'application/json' },
    text: vi.fn().mockResolvedValue(JSON.stringify(body))
  });
}

// ── authService.login ──────────────────────────────────────────────────────
describe('authService.login', () => {
  afterEach(() => vi.restoreAllMocks());

  it('stores accessToken in localStorage and returns data on success', async () => {
    const payload = { accessToken: 'tok123', user: { id: '1', username: 'Alice', email: 'a@a.com', role: 'shopkeeper' } };
    global.fetch = mockFetch(payload);
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');

    const data = await authService.login('a@a.com', 'pass123');

    expect(data.accessToken).toBe('tok123');
    expect(storageSpy).toHaveBeenCalledWith('accessToken', 'tok123');
  });

  it('throws an error when response is not ok', async () => {
    global.fetch = mockFetch({ message: 'Invalid credentials' }, false, 401);

    await expect(authService.login('bad@bad.com', 'wrong')).rejects.toThrow('Invalid credentials');
  });

  it('throws when no accessToken is returned', async () => {
    global.fetch = mockFetch({ user: {} }, true, 200);

    await expect(authService.login('a@a.com', 'pass')).rejects.toThrow('No access token received');
  });
});

// ── authService.register ───────────────────────────────────────────────────
describe('authService.register', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns data on successful registration', async () => {
    const payload = { accessToken: 'reg-tok', user: { id: '2', username: 'Bob', email: 'b@b.com', role: null } };
    global.fetch = mockFetch(payload);

    const data = await authService.register('Bob', 'b@b.com', 'pass123');

    expect(data.accessToken).toBe('reg-tok');
  });

  it('throws for missing required fields', async () => {
    await expect(authService.register('', 'b@b.com', 'pass')).rejects.toThrow('All fields are required');
  });

  it('throws for invalid email format', async () => {
    await expect(authService.register('Bob', 'invalidemail', 'pass123')).rejects.toThrow('Invalid email format');
  });

  it('throws for short password', async () => {
    await expect(authService.register('Bob', 'b@b.com', '123')).rejects.toThrow('at least 6 characters');
  });

  it('throws when server returns error', async () => {
    global.fetch = mockFetch({ message: 'User already exists' }, false, 400);

    await expect(authService.register('Bob', 'b@b.com', 'pass123')).rejects.toThrow('User already exists');
  });
});

// ── authService.googleAuth ─────────────────────────────────────────────────
describe('authService.googleAuth', () => {
  afterEach(() => vi.restoreAllMocks());

  it('stores token and returns data on success', async () => {
    const payload = { accessToken: 'g-tok', user: { id: '3', username: 'Carol', email: 'c@c.com', role: null } };
    global.fetch = mockFetch(payload);
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');

    const data = await authService.googleAuth({
      access_token: 'google-access-token',
      userInfo: { email: 'c@c.com', name: 'Carol', sub: 'google-sub-123' }
    });

    expect(data.accessToken).toBe('g-tok');
    expect(storageSpy).toHaveBeenCalledWith('accessToken', 'g-tok');
  });

  it('throws when Google auth endpoint returns error', async () => {
    global.fetch = mockFetch({ message: 'Google authentication failed' }, false, 500);

    await expect(
      authService.googleAuth({
        access_token: 'bad-token',
        userInfo: { email: 'c@c.com', name: 'Carol', sub: 'sub' }
      })
    ).rejects.toThrow('Google authentication failed');
  });
});

// ── authService.getMe ──────────────────────────────────────────────────────
describe('authService.getMe', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns user data when token exists', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('valid-token');
    global.fetch = mockFetch({ id: '1', username: 'Alice' });

    const data = await authService.getMe();
    expect(data.username).toBe('Alice');
  });

  it('throws when no accessToken in localStorage', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    await expect(authService.getMe()).rejects.toThrow('No access token found');
  });
});
