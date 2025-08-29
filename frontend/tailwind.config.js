/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Elastic brand colors
        elastic: {
          blue: '#0077CC',
          'light-blue': '#00BFD6',
          green: '#17A55B',
          yellow: '#F5A623',
          orange: '#F68D2E',
          red: '#E7524B',
          purple: '#8E5FBF',
          pink: '#DD0A73',
          dark: '#25272A',
          'light-gray': '#98A2B3',
          'medium-gray': '#69707D',
          'dark-gray': '#343741',
        },
        // EUI theme colors
        eui: {
          'primary': '#0077CC',
          'accent': '#F68D2E',
          'success': '#17A55B',
          'warning': '#F5A623',
          'danger': '#E7524B',
          'subdued': '#69707D',
          'ghost': '#98A2B3',
        }
      },
      fontFamily: {
        'elastic': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        }
      },
      boxShadow: {
        'eui-xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'eui-sm': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'eui-md': '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
        'eui-lg': '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
