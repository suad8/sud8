/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9ecff",
          200: "#bcdcff",
          300: "#8fc4ff",
          400: "#57a4ff",
          500: "#2b7cff",
          600: "#155cff",
          700: "#1347d6",
          800: "#163ba8",
          900: "#183482"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(43,124,255,.25), 0 12px 40px rgba(0,0,0,.45)"
      }
    }
  },
  plugins: []
};
