/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'newbiz-purple': '#ff00ff',
        'newbiz-dark-purple': '#8b00ff',
        'newbiz-indigo': '#4a148c',
        'newbiz-blue': '#2196f3',
        'newbiz-cyan': '#00bcd4',
      },
      backgroundImage: {
        'gradient-newbiz': 'linear-gradient(135deg, #ff00ff 0%, #8b00ff 25%, #4a148c 50%, #2196f3 75%, #00bcd4 100%)',
      },
    },
  },
  plugins: [],
}

