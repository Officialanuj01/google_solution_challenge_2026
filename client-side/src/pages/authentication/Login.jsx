import { useState } from 'react';
import { LogIn, Mail, Lock, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import config from '../../config';

// Only import useGoogleLogin if clientId is configured
let useGoogleLogin = null;
if (config.googleClientId) {
  try {
    const googleOAuth = await import('@react-oauth/google');
    useGoogleLogin = googleOAuth.useGoogleLogin;
  } catch (e) {
    // Google OAuth module not available
  }
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [devStatus, setDevStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleAvailable = !!useGoogleLogin && !!config.googleClientId;
  
  const { login, googleAuth } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const data = await login(email, password);
      if (onLogin) {
        onLogin({
          name: data.user.username,
          email: data.user.email,
          id: data.user.id,
          role: data.user.role
        });
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (!googleAvailable) return;
    setGoogleLoading(true);
    try {
      // This will be called only when Google OAuth is properly configured
      useGoogleLogin({
        onSuccess: async (codeResponse) => {
          try {
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${codeResponse.access_token}` }
            });
            const userInfo = await userInfoResponse.json();
            
            const data = await googleAuth({
              access_token: codeResponse.access_token,
              id_token: codeResponse.id_token,
              userInfo
            });
            
            if (onLogin) {
              onLogin({
                name: data.user.username,
                email: data.user.email,
                id: data.user.id,
                role: data.user.role
              });
            }
          } catch (err) {
            setError(err.message || 'Google login failed');
          } finally {
            setGoogleLoading(false);
          }
        },
        onError: () => {
          setError('Google login failed');
          setGoogleLoading(false);
        },
        flow: 'implicit'
      })();
    } catch (err) {
      setError('Google login not available');
      setGoogleLoading(false);
    }
  }

  function handleDevLogin() {
    setEmail('teamdsa@gmail.com');
    setPassword('teamdsa');
    setDevStatus('These are test credentials meant to be used for Pulse Sparkathon.');
    setError('');
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      {/* Enhanced Email Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-500">
          <Mail className="w-5 h-5" />
        </div>
        <input
          type="email"
          placeholder="Email"
          className="h-12 w-full rounded-xl border border-cyan-200 bg-gradient-to-r from-white to-cyan-50/30 pl-12 pr-4 text-base text-sky-800 placeholder:text-sky-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 hover:border-cyan-300"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>

      {/* Enhanced Password Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500">
          <Lock className="w-5 h-5" />
        </div>
        <input
          type="password"
          placeholder="Password"
          className="h-12 w-full rounded-xl border border-blue-200 bg-gradient-to-r from-white to-blue-50/30 pl-12 pr-4 text-base text-sky-800 placeholder:text-sky-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:border-blue-300"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>

      {/* Enhanced Error/Status Messages */}
      <div style={{ minHeight: '1.5em' }} className="relative">
        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            <span>{error}</span>
          </div>
        )}
        {!error && devStatus && (
          <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <Zap className="w-2 h-2 text-white" />
            </div>
            <span>{devStatus}</span>
          </div>
        )}
      </div>

      {/* Enhanced Buttons */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            className="group inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 px-6 py-3 text-sm font-medium text-cyan-700 hover:from-cyan-100 hover:to-blue-100 hover:border-cyan-300 transition-all duration-300 transform hover:scale-105"
            style={{ minWidth: '140px' }}
            onClick={handleDevLogin}
          >
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 group-hover:animate-pulse" />
              <span>Demo Credentials</span>
            </div>
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="group inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-500 hover:from-cyan-600 hover:via-blue-600 hover:to-sky-600 px-6 py-3 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center space-x-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <LogIn className="w-4 h-4 group-hover:animate-bounce" />
              )}
              <span>{loading ? 'Logging in...' : 'Log In'}</span>
            </div>
          </button>
        </div>

        {/* Google Sign In — only shown when OAuth is configured */}
        {googleAvailable && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="group w-full inline-flex items-center justify-center rounded-xl bg-white border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {googleLoading ? (
                <div className="w-5 h-5 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </button>
          </>
        )}
      </div>
    </form>
  );
}

export default Login;