/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        avena: '#F4F1EA',
        carbon: '#1A1A1A',
        carmin: '#8B2635',
        bosque: '#2C3D30',
        glassBg: 'rgba(244, 241, 234, 0.82)',
        glassBorder: 'rgba(44, 61, 48, 0.12)',
      },
      boxShadow: {
        'carmin-glow': '0 8px 24px -4px rgba(139, 38, 53, 0.35)',
        'bosque-subtle': '0 4px 16px -2px rgba(44, 61, 48, 0.15)',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
