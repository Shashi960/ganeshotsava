/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7A1A29', // Deep Maroon / Vermilion
          light: '#9E2A3B',
          dark: '#54101B',
        },
        secondary: {
          DEFAULT: '#D95D39', // Saffron / Orange
          light: '#E87D5F',
          dark: '#B04121',
        },
        accent: {
          DEFAULT: '#C5A059', // Antique Gold
          light: '#DBC087',
          dark: '#9E7E3D',
        },
        warm: {
          DEFAULT: '#FDFBF7', // Warm Ivory / Cream
          dark: '#F5EFE6',
          light: '#FFFFFF',
        },
        charcoal: {
          DEFAULT: '#2C2A29', // Deep Charcoal
          light: '#4A4846',
          dark: '#1A1817',
        }
      },
      fontFamily: {
        sanskrit: ['Cinzel', 'serif'],
        kannada: ['Noto Sans Kannada', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
