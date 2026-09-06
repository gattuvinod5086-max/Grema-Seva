/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./web/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#67001A",
          light: "#8A1538",
        },
        tg: {
          maroon: "#67001A",
          "maroon-light": "#8A1538",
          gold: "#CCB252",
          green: "#008A3B",
          "green-light": "#059669",
          bg: "#FAF9F6",
          text: "#1F2937",
          muted: "#64748B",
          border: "#E5E7EB",
          /* legacy */
          pink: "#67001A",
          "emblem-green": "#008A3B",
          "emblem-gold": "#CCB252",
          sidebar: "#67001A",
        },
        gold: "#CCB252",
        amber: "#F59E0B",
        emerald: "#008A3B",
      },
      fontFamily: {
        heading: ["Instrument Serif", "Georgia", "serif"],
        body: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        telugu: ["Noto Sans Telugu", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        glass: "0.75rem",
      },
      boxShadow: {
        glass: "0 1px 3px rgba(0, 0, 0, 0.06)",
        card: "0 1px 3px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 4px 12px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
