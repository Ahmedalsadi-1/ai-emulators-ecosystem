/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Unified dark theme colors from UI specification
        bg: {
          primary: '#1a1a1a',
          secondary: '#2a2a2a',
          card: '#333333',
        },
        accent: {
          primary: '#00d4aa',
          secondary: '#00b896',
          hover: '#00a085',
        },
        text: {
          primary: '#ffffff',
          secondary: '#cccccc',
          muted: '#999999',
        },
        status: {
          success: '#00d4aa',
          warning: '#ffa500',
          error: '#ff4444',
          running: '#0099cc',
        },
        border: {
          DEFAULT: '#444444',
          hover: '#00d4aa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '1.875rem', // 30px
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 212, 170, 0.3)',
      },
      animation: {
        pulse: 'pulse 2s infinite',
      },
    },
  },
  plugins: [],
}