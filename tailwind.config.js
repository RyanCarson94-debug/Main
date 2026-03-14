/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // Only scan files that can contain Tailwind classes (JSX/TSX).
    // Pure .ts utility files (store, utils, types) don't have class names
    // and scanning them can produce false-positive CSS that breaks the minifier.
    "./src/**/*.{jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#7C3AED',
          secondary: '#EC4899',
          accent: '#F59E0B',
          success: '#10B981',
          danger: '#EF4444',
          dark: '#0F0A1E',
          card: '#1A1035',
          border: '#2D1F5E',
        }
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-in-right': 'slideInRight 0.22s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(24px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
