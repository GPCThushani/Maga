/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F7F5',
        surface: '#FFFFFF',
        border: '#E4E4E1',
        textPrimary: '#202124',
        textSecondary: '#6B6F76',
        textMuted: '#969A9F',
        accent: {
          DEFAULT: '#2457A6',
          light: '#EAF1FB',
        },
        success: {
          DEFAULT: '#2F7D5C',
          light: '#EAF4EF',
        },
        warning: {
          DEFAULT: '#B7791F',
          light: '#FBF3E3',
        },
        danger: {
          DEFAULT: '#B94A48',
          light: '#F9EAEA',
        },
      },
      borderRadius: {
        btn: '8px',
        input: '8px',
        card: '12px',
        modal: '14px',
      },
    },
  },
  plugins: [],
}