/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // AWS Console colors
        'aws-dark': '#232f3e',
        'aws-darker': '#16191f',
        'aws-orange': '#ff9900',
        'aws-border': '#414750',
        'aws-hover': '#2a3b4c',
        'aws-text': '#d5dbdb',
        'aws-text-muted': '#aab7b8',
        'aws-green': '#1d8102',
        'aws-red': '#d13212',
        'aws-yellow': '#f2c94c',
        'aws-blue': '#0073bb',
      },
    },
  },
  plugins: [],
}
