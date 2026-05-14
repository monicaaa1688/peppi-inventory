/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        butter: {
          50:  '#FFFDF8',
          100: '#FFF8E7',
          200: '#FFF0C8',
          300: '#FFE39A',
        },
        sakura:   { DEFAULT: '#FFB7C5', light: '#FFD6DF', dark: '#F08CA0' },
        mint:     { DEFAULT: '#B5EAD7', light: '#D8F5EC', dark: '#7ECFB2' },
        lavender: { DEFAULT: '#C7CEEA', light: '#E2E6F8', dark: '#9AAAD8' },
        peach:    { DEFAULT: '#FFDAC1', light: '#FFEEDD', dark: '#F5B894' },
        sunshine: { DEFAULT: '#FFD93D', light: '#FFF0A0', dark: '#F0BF00' },
        warm:     { brown: '#5C4A3A', gray: '#A89080' },
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        soft:    '0 4px 24px rgba(92,74,58,0.08)',
        'soft-lg': '0 10px 40px rgba(92,74,58,0.14)',
        gummy:   '0 6px 0 rgba(92,74,58,0.18)',
        pressed: '0 2px 0 rgba(92,74,58,0.18)',
      },
      keyframes: {
        wiggle: {
          '0%,100%': { transform: 'rotate(0deg) scale(1)' },
          '25%':     { transform: 'rotate(-8deg) scale(1.1)' },
          '75%':     { transform: 'rotate(8deg) scale(1.1)' },
        },
        pop: {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.18)' },
          '70%':  { transform: 'scale(0.94)' },
          '100%': { transform: 'scale(1)' },
        },
        floatUp: {
          '0%':   { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-20px)', opacity: '0' },
        },
        numberBounce: {
          '0%,100%': { transform: 'translateY(0)' },
          '40%':     { transform: 'translateY(-6px)' },
          '60%':     { transform: 'translateY(2px)' },
        },
      },
      animation: {
        wiggle:  'wiggle 0.35s ease',
        pop:     'pop 0.3s ease',
        floatUp: 'floatUp 0.6s ease forwards',
        numberBounce: 'numberBounce 0.35s ease',
      },
    },
  },
  plugins: [],
}
