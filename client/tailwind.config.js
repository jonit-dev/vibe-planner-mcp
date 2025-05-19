/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#1E1E2E',
        surface: '#313244',
        primary: {
          DEFAULT: '#89B4FA',
          focus: '#74C7EC',
          content: '#1E1E2E',
        },
        secondary: {
          DEFAULT: '#CBA6F7',
          focus: '#DDB6FF',
          content: '#1E1E2E',
        },
        accent: {
          DEFAULT: '#FAB387',
          focus: '#F9C096',
          content: '#1E1E2E',
        },
        neutral: '#313244',
        'base-100': '#1E1E2E',
        'base-200': '#181825',
        'base-300': '#11111B',
        'base-content': '#CDD6F4',
        info: '#74C7EC',
        success: '#A6E3A1',
        warning: '#F9E2AF',
        error: '#F38BA8',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        mytheme: {
          "primary": "#89B4FA",
          "secondary": "#CBA6F7",
          "accent": "#FAB387",
          "neutral": "#313244",
          "base-100": "#1E1E2E",
          "info": "#74C7EC",
          "success": "#A6E3A1",
          "warning": "#F9E2AF",
          "error": "#F38BA8",
        },
      },
    ],
    darkTheme: "mytheme",
  },
}