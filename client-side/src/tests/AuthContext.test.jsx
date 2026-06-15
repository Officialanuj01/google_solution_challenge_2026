/**
 * Unit Tests — AuthContext
 * Renders AuthProvider and tests login/logout/googleAuth context functions.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';

// ── Mock authService ───────────────────────────────────────────────────────
vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    googleAuth: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    updateRole: vi.fn()
  }
}));

import { authService } from '../services/auth.service';

// ── Helper consumer component ──────────────────────────────────────────────
function AuthConsumer({ action }) {
  const ctx = useAuth();
  useEffect(() => {
    if (action) action(ctx);
  }, [action, ctx]);
  return (
    <div>
      <span data-testid="user">{ctx.user ? ctx.user.username : 'none'}</span>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <button onClick={action ? () => action(ctx) : undefined}>trigger</button>
    </div>
  );
}

function renderWithAuth(action) {
  return render(
    <AuthProvider>
      <AuthConsumer action={action} />
    </AuthProvider>
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Default: no existing token
    authService.getMe.mockRejectedValue(new Error('no token'));
    authService.refreshToken.mockRejectedValue(new Error('no refresh'));
  });

  it('starts with loading=true then settles to loading=false with no user', async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('hydrates user from localStorage on mount', async () => {
    localStorage.setItem('accessToken', 'stored-token');
    authService.getMe.mockResolvedValue({ id: '1', username: 'Alice', email: 'a@a.com', role: 'shopkeeper' });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Alice');
    });
  });

  it('login() sets user and returns data', async () => {
    const fakeData = { accessToken: 'tok', user: { id: '2', username: 'Bob', email: 'b@b.com', role: null } };
    authService.login.mockResolvedValue(fakeData);
    authService.getMe.mockRejectedValue(new Error('no token'));

    let capturedCtx;
    renderWithAuth((ctx) => { capturedCtx = ctx; });

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      const data = await capturedCtx.login('b@b.com', 'pass');
      expect(data.accessToken).toBe('tok');
    });

    expect(screen.getByTestId('user').textContent).toBe('Bob');
  });

  it('login() throws and does not set user on failure', async () => {
    authService.login.mockRejectedValue(new Error('Invalid credentials'));
    authService.getMe.mockRejectedValue(new Error('no token'));

    let capturedCtx;
    renderWithAuth((ctx) => { capturedCtx = ctx; });

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      await expect(capturedCtx.login('bad@bad.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });

    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('logout() clears user', async () => {
    const fakeData = { accessToken: 'tok', user: { id: '2', username: 'Bob', email: 'b@b.com', role: null } };
    authService.login.mockResolvedValue(fakeData);
    authService.logout.mockResolvedValue(true);
    authService.getMe.mockRejectedValue(new Error('no token'));

    let capturedCtx;
    renderWithAuth((ctx) => { capturedCtx = ctx; });

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    // Login first
    await act(async () => { await capturedCtx.login('b@b.com', 'pass'); });
    expect(screen.getByTestId('user').textContent).toBe('Bob');

    // Now logout
    await act(async () => { await capturedCtx.logout(); });
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('googleAuth() sets user on success', async () => {
    authService.googleAuth.mockResolvedValue({
      accessToken: 'g-tok',
      user: { id: '3', username: 'Carol', email: 'c@c.com', role: null }
    });
    authService.getMe.mockRejectedValue(new Error('no token'));

    let capturedCtx;
    renderWithAuth((ctx) => { capturedCtx = ctx; });

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      await capturedCtx.googleAuth({ access_token: 'g-access', userInfo: { email: 'c@c.com', name: 'Carol', sub: 'sub' } });
    });

    expect(screen.getByTestId('user').textContent).toBe('Carol');
  });

  it('throws when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AuthConsumer />)).toThrow('useAuth must be used within an AuthProvider');
    consoleSpy.mockRestore();
  });
});
