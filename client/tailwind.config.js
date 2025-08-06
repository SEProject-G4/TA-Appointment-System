/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors:{
        'primary': 'rgb(var(--color-primary) / <alpha-value>)',  //Main brand color(blue)
        'primary-light': 'rgb(var(--color-primary-light) / <alpha-value>)', //lighter version
        'primary-dark': 'rgb(var(--color-primary-dark) / <alpha-value>)', //darker version
        
        'secondary': 'rgb(var(--color-secondary) / <alpha-value>)',     //Secondary color
        'accent': 'rgb(var(--color-accent) / <alpha-value>)',         //Highlight/CTA color
        'accent-light': 'rgb(var(--color-accent-light) / <alpha-value>)', //Lighter version of accent

        // --- Background Colors ---
        'bg-page': 'rgb(var(--color-bg-page) / <alpha-value>)',       // Main page background
        'bg-card': 'rgb(var(--color-bg-card) / <alpha-value>)',       // Background for cards, modals, etc.
        'bg-header': 'rgb(var(--color-bg-header) / <alpha-value>)',   // Background for header/navbar

        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)', // Main text color
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)', // Secondary text color (light color)
        'text-inverted': 'rgb(var(--color-text-inverted) / <alpha-value>)', // Text on primary/dark backgrounds

        'border-default': 'rgb(var(--color-border-default) / <alpha-value>)', // Default border color
        'border-strong': 'rgb(var(--color-border-strong) / <alpha-value>)',   // Stronger border for separation

        // --- Semantic State Colors ---
        'success': 'rgb(var(--color-success) / <alpha-value>)',
        'warning': 'rgb(var(--color-warning) / <alpha-value>)',
        'error': 'rgb(var(--color-error) / <alpha-value>)',
        'info': 'rgb(var(--color-info) / <alpha-value>)',
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
        
        // Add specific utility classes for each font
        'inter': ['Inter', 'sans-serif'],
        'montserrat': ['Montserrat', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
        'raleway': ['Raleway', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
}

