/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js}', './public/popup.html'],
  theme: {
    extend: {
      colors: {
        primary: '#093d65',
        secondary: '#60d394',
        yellow: '#ffd97d',
        green: '#aaf683',
        red: '#e86558',
        'arch-gray': '#f6f6f6',
        'arch-black': '##262626',
        'arch-gray-1': '#595959',
        'arch-gray-2': '#8a8a8a',
        white: '#ffffff',
        black: '#000000',
      },
    },
  },
  plugins: [],
};
