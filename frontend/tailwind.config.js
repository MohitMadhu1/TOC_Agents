/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#030303",
        brand: {
          primary: "#001A4D",
          secondary: "#D4AF37",
          accent: "#9E7E38",
        }
      }
    },
  },
  plugins: [],
}
