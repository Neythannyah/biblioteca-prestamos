/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAF6EF',
        card: {
          DEFAULT: '#FFFDF9',
          foreground: '#3B2F27'
        },
        border: '#E8DFD0',
        muted: {
          DEFAULT: '#F2EBDD',
          foreground: '#8A7B6C'
        },
        foreground: '#3B2F27',
        primary: {
          DEFAULT: '#6B4F3A',
          foreground: '#FAF6EF',
          hover: '#573F2E',
          light: '#F4ECE4'
        },
        secondary: {
          DEFAULT: '#EDE3D3',
          foreground: '#3B2F27',
          hover: '#E2D5C1'
        },
        accent: {
          DEFAULT: '#EDE3D3',
          foreground: '#3B2F27'
        },
        ring: '#A68A6D',
        success: {
          DEFAULT: '#6B7F4E',
          foreground: '#FAF6EF',
          light: '#F0F4E8'
        },
        warning: {
          DEFAULT: '#B8862F',
          foreground: '#FAF6EF',
          light: '#FDF6E9'
        },
        destructive: {
          DEFAULT: '#B5523B',
          foreground: '#FAF6EF',
          light: '#FDF0ED'
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(59, 47, 39, 0.05), 0 1px 2px -1px rgba(59, 47, 39, 0.05)',
        'card': '0 4px 20px -2px rgba(107, 79, 58, 0.06), 0 2px 6px -1px rgba(107, 79, 58, 0.03)',
        'popover': '0 10px 25px -5px rgba(107, 79, 58, 0.1), 0 8px 10px -6px rgba(107, 79, 58, 0.05)',
      }
    },
  },
  plugins: [],
}

