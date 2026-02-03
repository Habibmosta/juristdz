/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Enhanced responsive breakpoints
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Custom breakpoints for specific use cases
        'mobile': {'max': '640px'},
        'tablet': {'min': '641px', 'max': '1024px'},
        'desktop': {'min': '1025px'},
        // Touch device detection
        'touch': {'raw': '(hover: none) and (pointer: coarse)'},
        'no-touch': {'raw': '(hover: hover) and (pointer: fine)'},
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
      },
      colors: {
        'legal-blue': '#0f172a',
        'legal-gold': '#c29b40',
        'legal-gold-light': '#e5c983',
      },
      // Enhanced spacing scale for responsive design
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Responsive font sizes
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        // Responsive text sizes
        'responsive-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'responsive-base': ['1rem', { lineHeight: '1.5rem' }],
        'responsive-lg': ['1.125rem', { lineHeight: '1.75rem' }],
      },
      // Enhanced animation and transitions
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
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
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      // Enhanced shadows for depth
      boxShadow: {
        'mobile': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'tablet': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'desktop': '0 8px 24px rgba(0, 0, 0, 0.1)',
        'legal-gold': '0 4px 14px 0 rgba(194, 155, 64, 0.2)',
        'legal-blue': '0 4px 14px 0 rgba(15, 23, 42, 0.2)',
      },
      // Responsive border radius
      borderRadius: {
        'mobile': '0.5rem',
        'tablet': '0.75rem',
        'desktop': '1rem',
      },
    }
  },
  plugins: [
    // Custom plugin for responsive utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Mobile-first responsive padding
        '.p-responsive': {
          padding: theme('spacing.3'),
          '@screen sm': {
            padding: theme('spacing.4'),
          },
          '@screen lg': {
            padding: theme('spacing.6'),
          },
        },
        // Mobile-first responsive margin
        '.m-responsive': {
          margin: theme('spacing.2'),
          '@screen sm': {
            margin: theme('spacing.3'),
          },
          '@screen lg': {
            margin: theme('spacing.4'),
          },
        },
        // Mobile-first responsive gap
        '.gap-responsive': {
          gap: theme('spacing.2'),
          '@screen sm': {
            gap: theme('spacing.3'),
          },
          '@screen lg': {
            gap: theme('spacing.4'),
          },
        },
        // Touch-friendly button sizing
        '.btn-touch': {
          minHeight: '44px',
          minWidth: '44px',
          padding: '12px 16px',
          '@screen sm': {
            minHeight: 'auto',
            minWidth: 'auto',
            padding: '8px 12px',
          },
        },
        // Responsive text sizing
        '.text-responsive': {
          fontSize: theme('fontSize.sm[0]'),
          lineHeight: theme('fontSize.sm[1].lineHeight'),
          '@screen sm': {
            fontSize: theme('fontSize.base[0]'),
            lineHeight: theme('fontSize.base[1].lineHeight'),
          },
          '@screen lg': {
            fontSize: theme('fontSize.lg[0]'),
            lineHeight: theme('fontSize.lg[1].lineHeight'),
          },
        },
        // Safe area padding for mobile devices
        '.safe-area-padding': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
        },
      }
      addUtilities(newUtilities)
    }
  ]
}