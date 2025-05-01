/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Scans the main HTML file
    "./src/**/*.{js,ts,jsx,tsx}", // Scans all JavaScript/TypeScript/JSX files in the src folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}