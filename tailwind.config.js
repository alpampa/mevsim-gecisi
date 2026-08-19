/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        book: ['"Baloo 2"', 'ui-rounded', 'sans-serif'],
      },
      colors: {
        night: '#1F4D3A',
        mustard: '#F2C14E',
        rosepink: '#D96C8F',
        sand: '#E8C98F',
        sage: '#8FA98A',
        emerald2: '#1E5B4A',
        cream: '#FDF3E3',
      },
    },
  },
  plugins: [],
};
