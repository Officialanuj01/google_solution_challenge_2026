import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Signup({ onSignup }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    try {
      const data = await register(name, email, password);
      // Clear form
      setName('');
      setEmail('');
      setPassword('');
      // Notify parent component with user data
      if (onSignup) onSignup(data.user);
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message || 'Failed to create account');
    }
  }

  return (
    <div className="relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating User Icon */}
        <div className="absolute -top-8 -right-8 w-12 h-12 text-cyan-200 animate-float1">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>

        {/* Floating Email Icon */}
        <div className="absolute -bottom-6 -left-6 w-10 h-10 text-cyan-200 animate-float2">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </div>

        {/* Floating Security Icon */}
        <div className="absolute top-1/2 -right-10 w-8 h-8 text-cyan-200 animate-float3">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H16.2V16H7.8V11H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z"/>
          </svg>
        </div>

        {/* Morphing Background Shape */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full opacity-20 animate-morph-slow"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full opacity-20 animate-morph-medium"></div>
      </div>

      {/* Signup Form */}
      <form className="relative flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="relative group">
            <input
              type="text"
              placeholder="Full Name"
              className="h-12 w-full rounded-xl border border-cyan-300 bg-white/80 backdrop-blur-sm px-4 text-base text-zinc-800 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 placeholder:text-zinc-400 transition-all duration-300 hover:bg-white/90 focus:bg-white/95"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <div className="absolute inset-y-0 right-3 flex items-center">
              <svg className="w-5 h-5 text-zinc-400 group-focus-within:text-cyan-400 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
          </div>

          <div className="relative group">
            <input
              type="email"
              placeholder="Email Address"
              className="h-12 w-full rounded-xl border border-cyan-300 bg-white/80 backdrop-blur-sm px-4 text-base text-zinc-800 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 placeholder:text-zinc-400 transition-all duration-300 hover:bg-white/90 focus:bg-white/95"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <div className="absolute inset-y-0 right-3 flex items-center">
              <svg className="w-5 h-5 text-zinc-400 group-focus-within:text-cyan-400 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
          </div>

          <div className="relative group">
            <input
              type="password"
              placeholder="Password"
              className="h-12 w-full rounded-xl border border-cyan-300 bg-white/80 backdrop-blur-sm px-4 text-base text-zinc-800 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 placeholder:text-zinc-400 transition-all duration-300 hover:bg-white/90 focus:bg-white/95"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <div className="absolute inset-y-0 right-3 flex items-center">
              <svg className="w-5 h-5 text-zinc-400 group-focus-within:text-cyan-400 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H16.2V16H7.8V11H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z"/>
              </svg>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="relative inline-flex items-center justify-center h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 group overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            Create Account
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>

        {error && (
          <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-200">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}