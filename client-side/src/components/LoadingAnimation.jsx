import React from 'react';
import { Truck, Package, BarChart2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LoadingAnimation = ({ message = "Loading..." }) => {
  const { themeColors } = useTheme();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-white/95 via-gray-50/95 to-slate-50/95 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
      {/* Theme-aware background overlay */}
      <div className="absolute inset-0 theme-bg-primary opacity-95"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-teal-500/10 rounded-full animate-float-slow"></div>
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-gradient-to-br from-purple-400/10 to-violet-500/10 rounded-full animate-float-medium"></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-gradient-to-br from-orange-400/10 to-amber-500/10 rounded-full animate-float-fast"></div>
      </div>

      <div className="relative z-10 text-center px-6">
        {/* Main loading animation */}
        <div className="mb-8">
          {/* Rotating logistics icons */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Outer ring */}
            <div className="absolute inset-0 border-4 border-transparent border-t-emerald-500 border-r-teal-500 rounded-full animate-spin-slow"></div>
            
            {/* Middle ring */}
            <div className="absolute inset-2 border-3 border-transparent border-t-purple-500 border-l-violet-500 rounded-full animate-spin-reverse"></div>
            
            {/* Inner content */}
            <div className="absolute inset-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
              <Truck className="w-6 h-6 text-white animate-bounce" />
            </div>
            
            {/* Floating icons around the main circle */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center animate-orbit">
              <Package className="w-3 h-3 text-white" />
            </div>
            
            <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center animate-orbit-reverse">
              <BarChart2 className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Pulsing dots */}
          <div className="flex justify-center gap-2 mb-6">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse-delay-0"></div>
            <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse-delay-200"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse-delay-400"></div>
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse-delay-600"></div>
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
            PREDELIX
          </h2>
          
          <p className="theme-text-secondary text-lg font-medium">
            {message}
          </p>
          
          {/* Animated loading bar */}
          <div className="w-48 mx-auto mt-4">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-500 rounded-full animate-loading-bar"></div>
            </div>
          </div>
        </div>

        {/* Subtle tagline */}
        <p className="theme-text-muted text-sm mt-6 opacity-70">
          AI-Powered Logistics Intelligence
        </p>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes spin-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(40px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(40px) rotate(-360deg); }
        }
        
        @keyframes orbit-reverse {
          0% { transform: rotate(360deg) translateX(40px) rotate(360deg); }
          100% { transform: rotate(0deg) translateX(40px) rotate(0deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); }
          50% { transform: translateY(-15px) scale(1.1) rotate(180deg); }
        }
        
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(0.95); }
        }
        
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes pulse-delay-0 {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.7; }
          40% { transform: scale(1.2); opacity: 1; }
        }
        
        @keyframes pulse-delay-200 {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.7; }
          40% { transform: scale(1.2); opacity: 1; }
        }
        
        @keyframes pulse-delay-400 {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.7; }
          40% { transform: scale(1.2); opacity: 1; }
        }
        
        @keyframes pulse-delay-600 {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.7; }
          40% { transform: scale(1.2); opacity: 1; }
        }
        
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 2s linear infinite; }
        .animate-orbit { animation: orbit 4s linear infinite; }
        .animate-orbit-reverse { animation: orbit-reverse 3s linear infinite; }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 4s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 3s ease-in-out infinite; }
        .animate-loading-bar { animation: loading-bar 2s ease-in-out infinite; }
        .animate-pulse-delay-0 { animation: pulse-delay-0 1.5s ease-in-out infinite; }
        .animate-pulse-delay-200 { animation: pulse-delay-200 1.5s ease-in-out infinite 0.2s; }
        .animate-pulse-delay-400 { animation: pulse-delay-400 1.5s ease-in-out infinite 0.4s; }
        .animate-pulse-delay-600 { animation: pulse-delay-600 1.5s ease-in-out infinite 0.6s; }
        
        .border-3 { border-width: 3px; }
      `}</style>
    </div>
  );
};

export default LoadingAnimation;
