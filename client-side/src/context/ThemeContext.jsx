import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light');

  // Theme configurations
  const themes = {
    light: {
      id: 'light',
      name: 'Light',
      colors: {
        primary: 'bg-white',
        secondary: 'bg-gray-50',
        accent: 'bg-gradient-to-r from-cyan-500 to-blue-500',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        border: 'border-gray-200',
        nav: 'bg-white/90 backdrop-blur-xl',
        gradient: 'from-blue-50 via-cyan-50 to-white',
      },
      css: {
        '--bg-primary': '#ffffff',
        '--bg-secondary': '#f8fafc',
        '--bg-tertiary': '#f1f5f9',
        '--text-primary': '#1e293b',
        '--text-secondary': '#64748b',
        '--text-muted': '#94a3b8',
        '--accent': '#0ea5e9',
        '--accent-hover': '#0284c7',
        '--border': '#e2e8f0',
        '--shadow': 'rgba(0, 0, 0, 0.1)',
      }
    },
    dark: {
      id: 'dark',
      name: 'Dark',
      colors: {
        primary: 'bg-gray-900',
        secondary: 'bg-gray-800',
        accent: 'bg-gradient-to-r from-blue-600 to-purple-600',
        text: 'text-white',
        textSecondary: 'text-gray-300',
        border: 'border-gray-700',
        nav: 'bg-gray-900/90 backdrop-blur-xl',
        gradient: 'from-gray-900 via-gray-800 to-gray-900',
      },
      css: {
        '--bg-primary': '#111827',
        '--bg-secondary': '#1f2937',
        '--bg-tertiary': '#374151',
        '--text-primary': '#ffffff',
        '--text-secondary': '#d1d5db',
        '--text-muted': '#9ca3af',
        '--accent': '#3b82f6',
        '--accent-hover': '#2563eb',
        '--border': '#4b5563',
        '--shadow': 'rgba(0, 0, 0, 0.25)',
      }
    },
    ocean: {
      id: 'ocean',
      name: 'Ocean',
      colors: {
        primary: 'bg-slate-900',
        secondary: 'bg-slate-800',
        accent: 'bg-gradient-to-r from-cyan-500 to-teal-500',
        text: 'text-slate-100',
        textSecondary: 'text-slate-300',
        border: 'border-slate-600',
        nav: 'bg-slate-900/90 backdrop-blur-xl',
        gradient: 'from-slate-900 via-blue-900 to-cyan-900',
      },
      css: {
        '--bg-primary': '#0f172a',
        '--bg-secondary': '#1e293b',
        '--bg-tertiary': '#334155',
        '--text-primary': '#f1f5f9',
        '--text-secondary': '#cbd5e1',
        '--text-muted': '#94a3b8',
        '--accent': '#06b6d4',
        '--accent-hover': '#0891b2',
        '--border': '#475569',
        '--shadow': 'rgba(6, 182, 212, 0.15)',
      }
    },
    sunset: {
      id: 'sunset',
      name: 'Sunset',
      colors: {
        primary: 'bg-orange-50',
        secondary: 'bg-amber-50',
        accent: 'bg-gradient-to-r from-orange-500 to-pink-500',
        text: 'text-orange-900',
        textSecondary: 'text-orange-700',
        border: 'border-orange-200',
        nav: 'bg-orange-50/90 backdrop-blur-xl',
        gradient: 'from-orange-100 via-amber-50 to-yellow-50',
      },
      css: {
        '--bg-primary': '#fff7ed',
        '--bg-secondary': '#fed7aa',
        '--bg-tertiary': '#fdba74',
        '--text-primary': '#9a3412',
        '--text-secondary': '#c2410c',
        '--text-muted': '#ea580c',
        '--accent': '#f59e0b',
        '--accent-hover': '#d97706',
        '--border': '#fed7aa',
        '--shadow': 'rgba(249, 115, 22, 0.15)',
      }
    },
    forest: {
      id: 'forest',
      name: 'Forest',
      colors: {
        primary: 'bg-emerald-950',
        secondary: 'bg-emerald-900',
        accent: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        text: 'text-emerald-100',
        textSecondary: 'text-emerald-200',
        border: 'border-emerald-700',
        nav: 'bg-emerald-950/90 backdrop-blur-xl',
        gradient: 'from-emerald-950 via-green-900 to-teal-900',
      },
      css: {
        '--bg-primary': '#022c22',
        '--bg-secondary': '#064e3b',
        '--bg-tertiary': '#065f46',
        '--text-primary': '#d1fae5',
        '--text-secondary': '#a7f3d0',
        '--text-muted': '#6ee7b7',
        '--accent': '#10b981',
        '--accent-hover': '#059669',
        '--border': '#047857',
        '--shadow': 'rgba(16, 185, 129, 0.15)',
      }
    },
    cosmic: {
      id: 'cosmic',
      name: 'Cosmic',
      colors: {
        primary: 'bg-indigo-950',
        secondary: 'bg-purple-900',
        accent: 'bg-gradient-to-r from-purple-500 to-indigo-500',
        text: 'text-indigo-100',
        textSecondary: 'text-indigo-200',
        border: 'border-indigo-700',
        nav: 'bg-indigo-950/90 backdrop-blur-xl',
        gradient: 'from-indigo-950 via-purple-900 to-violet-900',
      },
      css: {
        '--bg-primary': '#1e1b4b',
        '--bg-secondary': '#312e81',
        '--bg-tertiary': '#4338ca',
        '--text-primary': '#e0e7ff',
        '--text-secondary': '#c7d2fe',
        '--text-muted': '#a5b4fc',
        '--accent': '#8b5cf6',
        '--accent-hover': '#7c3aed',
        '--border': '#6366f1',
        '--shadow': 'rgba(139, 92, 246, 0.15)',
      }
    },
  };

  // Apply theme to document
  const applyTheme = (themeId) => {
    const theme = themes[themeId];
    if (!theme) return;

    const root = document.documentElement;
    root.setAttribute('data-theme', themeId);
    
    // Apply CSS custom properties
    Object.entries(theme.css).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Apply theme class to body
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${themeId}`);
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('predelix-theme') || 'light';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // Change theme
  const changeTheme = (themeId) => {
    if (themes[themeId]) {
      setCurrentTheme(themeId);
      applyTheme(themeId);
      localStorage.setItem('predelix-theme', themeId);
    }
  };

  // Get current theme object
  const getCurrentTheme = () => themes[currentTheme];

  const value = {
    currentTheme,
    themes,
    changeTheme,
    getCurrentTheme,
    themeColors: themes[currentTheme]?.colors || themes.light.colors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
