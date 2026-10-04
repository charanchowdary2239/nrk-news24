/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4f9',
          100: '#e1e9f3',
          200: '#c3d3e7',
          300: '#95b3d6',
          400: '#5f8ec1',
          500: '#386fa8',
          600: '#28568b',
          700: '#214571',
          800: '#1d3b5f',
          900: '#0b2545', // Deep brand blue
          950: '#06172c',
        },
        breaking: {
          light: '#fef2f2',
          DEFAULT: '#dc2626',
          dark: '#b91c1c',
        }
      },
      fontFamily: {
        serif: ['Merriweather', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Cabinet Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
