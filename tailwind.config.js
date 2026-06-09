/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FEFDFB',
          100: '#FDFBF7',
          200: '#F8F5F0',
          300: '#F2EDE6',
          400: '#E8E0D6',
          500: '#D4C8BA',
          600: '#BFB0A3',
          700: '#9C8B7D',
          800: '#6B5B4E',
          900: '#2D2016',
        },
        warm: {
          50: '#FDF5EF',
          100: '#F9E8D9',
          200: '#F0D0B3',
          300: '#E8B89A',
          400: '#D4A574',
          500: '#C8956C',
          600: '#A67B5B',
          700: '#8B6248',
          800: '#6B4A36',
          900: '#4A3225',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E8EFE8',
          200: '#D1DFD1',
          300: '#B5CCB5',
          400: '#8FB38F',
          500: '#5BAD7A',
          600: '#4A9066',
          700: '#3D7554',
          800: '#325A42',
          900: '#264032',
        },
      },
      fontFamily: {
        display: ['"ZCOOL XiaoWei"', '"PingFang SC"', '"Noto Sans SC"', 'serif'],
        body: ['"Noto Sans SC"', '"PingFang SC"', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(45, 32, 22, 0.06)',
        'medium': '0 4px 16px rgba(45, 32, 22, 0.08)',
        'warm': '0 4px 16px rgba(200, 149, 108, 0.15)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
}
