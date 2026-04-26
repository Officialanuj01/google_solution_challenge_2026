import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '../../../components/motion-primitives/dialog';
import Login from './Login';
import Signup from './Signup';
import React from 'react';
import { Truck, Package, Globe, Zap, Shield, BarChart2 } from 'lucide-react';

export function Auth({ open, onOpenChange, onLogin, showTrigger = true }) {
  const [mode, setMode] = React.useState('login');

  // Pass onLogin to Login component
  function handleLoginSuccess(userData) {
    if (onLogin) onLogin(userData);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <button className="group relative px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-500 hover:from-cyan-600 hover:via-blue-600 hover:to-sky-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative flex items-center space-x-2">
              <Shield className="w-4 h-4 animate-pulse" />
              <span>{mode === 'login' ? 'Login' : 'Sign Up'}</span>
            </span>
          </button>
        </DialogTrigger>
      )}
      <DialogContent
        className={`
          w-full max-w-md p-8 shadow-[0_8px_32px_rgba(56,189,248,0.2)] bg-white/95 backdrop-blur-xl border border-cyan-200/50 relative text-slate-800 overflow-hidden
          transition-all duration-300
          ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
        `}
      >
        {/* Floating background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 w-6 h-6 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-lg animate-float1 flex items-center justify-center">
            <Truck className="w-3 h-3 text-cyan-500/60" />
          </div>
          <div className="absolute top-8 right-8 w-5 h-5 bg-gradient-to-br from-blue-400/20 to-sky-500/20 rounded-md animate-float2 flex items-center justify-center">
            <Package className="w-2.5 h-2.5 text-blue-500/60" />
          </div>
          <div className="absolute bottom-8 left-8 w-4 h-4 bg-gradient-to-br from-sky-400/20 to-cyan-500/20 rounded-full animate-float3 flex items-center justify-center">
            <Globe className="w-2 h-2 text-sky-500/60 animate-spin-slow" />
          </div>
          <div className="absolute bottom-4 right-4 w-5 h-5 bg-gradient-to-br from-cyan-300/20 to-blue-400/20 rounded-sm animate-float1 flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 text-cyan-500/60" />
          </div>
        </div>

        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/30 to-blue-50/30"></div>
        
        <DialogHeader className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center animate-float1">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-sky-600 bg-clip-text text-transparent">
              {mode === 'login' ? 'Welcome to Predelix' : 'Join Predelix'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sky-600 leading-relaxed">
            {mode === 'login'
              ? 'Access your AI-powered logistics dashboard and optimize your supply chain.'
              : 'Create your account and start revolutionizing your logistics operations.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 flex flex-col space-y-4 relative z-10">
          {mode === 'login'
            ? <Login onLogin={handleLoginSuccess} />
            : <Signup onSignup={() => setMode('login')} />
          }
        </div>
        
        <div className="mt-6 flex justify-between items-center text-sm relative z-10">
          <button
            className="group text-sky-600 hover:text-cyan-600 hover:underline transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            type="button"
          >
            <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span>
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Log in'}
            </span>
          </button>
        </div>
        
        <DialogClose className="absolute top-4 right-4 text-sky-600 hover:text-cyan-600 text-2xl font-bold z-20 w-8 h-8 rounded-full hover:bg-cyan-100 transition-all duration-300 transform hover:scale-110" aria-label="Close">
          ×
        </DialogClose>
        
        {/* Custom animations */}
        <style>{`
          @keyframes float1 {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-3px) rotate(2deg); }
          }
          @keyframes float2 {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(2px) rotate(-2deg); }
          }
          @keyframes float3 {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-2px) rotate(1deg); }
          }
          @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .animate-float1 { animation: float1 4s ease-in-out infinite; }
          .animate-float2 { animation: float2 5s ease-in-out infinite; }
          .animate-float3 { animation: float3 6s ease-in-out infinite; }
          .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}