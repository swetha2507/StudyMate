/** @type {import('tailwindcss').Config} */
export default {
  content: [],
  theme: {
  extend: {
    colors: {
      warmGrey: "#f7f5f2",
      gold: "#d4a857",
      brandOrange: "#ff8a00",
    },
    fontFamily: {
      heading: ["Playfair Display", "serif"],
      body: ["Inter", "sans-serif"],
    },
    borderRadius: {
      card: "1.2rem",
    },
    boxShadow: {
      soft: "0 4px 20px rgba(0,0,0,0.06)",
    },
  },
  },
  plugins: [],
}

