/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  safelist: [
    { pattern: /(bg|text|border)-(green|red|yellow|amber|orange|lime|emerald|cyan|sky|blue|violet)-(100|200|300|400|500|600|700)/ },
  ],
  theme: {
    extend: {
      colors: {
        aq: {
          sehrgut: "#16a34a",
          gut: "#22c55e",
          maessig: "#eab308",
            schlecht: "#ea580c",
          sehrschlecht: "#dc2626"
        }
      },
      fontFamily: {
        sans: ["system-ui", "Inter", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
}
