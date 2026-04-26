module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'float1': 'float1 6s ease-in-out infinite',
        'float2': 'float2 8s ease-in-out infinite',
        'float3': 'float3 7s ease-in-out infinite',
        'slide': 'slide 10s ease-in-out infinite',
        'slideInUp': 'slideInUp 1s ease-out forwards',
        'wave': 'wave 2s ease-in-out infinite',
        'morph-slow': 'morph-slow 20s ease-in-out infinite',
        'morph-medium': 'morph-medium 15s ease-in-out infinite',
        'morph-fast': 'morph-fast 12s ease-in-out infinite',
        'spin-slow': 'spin-slow 8s linear infinite',
        'draw-path': 'draw-path 3s ease-in-out infinite',
        'count-up': 'count-up 0.8s ease-out forwards',
      },
      keyframes: {
        float1: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        float2: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(15px) rotate(-5deg)' },
        },
        float3: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(3deg)' },
        },
        slide: {
          '0%': { transform: 'translateX(-20px)' },
          '50%': { transform: 'translateX(20px)' },
          '100%': { transform: 'translateX(-20px)' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(60px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        wave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-10deg)' },
          '75%': { transform: 'rotate(10deg)' },
        },
        'morph-slow': {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)', borderRadius: '50%' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', borderRadius: '30%' },
        },
        'morph-medium': {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)', borderRadius: '50%' },
          '50%': { transform: 'scale(0.8) rotate(-90deg)', borderRadius: '40%' },
        },
        'morph-fast': {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)', borderRadius: '50%' },
          '50%': { transform: 'scale(1.1) rotate(270deg)', borderRadius: '20%' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'draw-path': {
          '0%': { strokeDasharray: '0 1000' },
          '100%': { strokeDasharray: '1000 0' },
        },
        'count-up': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    }
  },
  plugins: [],
  darkMode: 'class', 
}