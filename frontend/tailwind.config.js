/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['Courier New', 'monospace'],
      },
      colors: {
        gov: {
          navy: '#1a3a5c',
          blue: '#2c5f8a',
          lightblue: '#4a80a8',
          grey: '#6b7280',
          lightgrey: '#f3f4f6',
          border: '#d1d5db',
          text: '#1f2937',
          muted: '#6b7280',
          white: '#ffffff',
          success: '#166534',
          danger: '#991b1b',
          warn: '#92400e',
        },
      },
    },
  },
  plugins: [],
}
