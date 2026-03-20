/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eefbff',
          100: '#d8f5ff',
          200: '#b9edff',
          300: '#89e3ff',
          400: '#51cfff',
          500: '#29b4ff',
          600: '#0098dc',
          700: '#0079b2',
          800: '#026593',
          900: '#085479',
          950: '#063551',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd4',
          200: '#ffd6a8',
          300: '#ffb870',
          400: '#ff9a3d',
          500: '#ff8c42',
          600: '#f06d10',
          700: '#c7520b',
          800: '#9e4111',
          900: '#7f3712',
          950: '#451a07',
        },
        slate: {
          925: '#0d1520',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        'elevated': '0 8px 30px rgb(0 0 0 / 0.08)',
        'inner-glow': 'inset 0 1px 0 0 rgb(255 255 255 / 0.05)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
