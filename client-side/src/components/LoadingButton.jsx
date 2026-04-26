import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingButton = ({ 
  children, 
  loading = false, 
  disabled = false, 
  className = "", 
  loadingText = "Loading...",
  ...props 
}) => {
  return (
    <button
      disabled={loading || disabled}
      className={`
        relative inline-flex items-center justify-center gap-2 
        transition-all duration-300 transform
        ${loading || disabled ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          {loadingText}
        </span>
      )}
    </button>
  );
};

export default LoadingButton;
