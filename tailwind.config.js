/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Zen Kaku Gothic New", "Inter", "ui-sans-serif", "system-ui"],
        serif: ["Noto Serif JP", "serif"],
        mono: ["Fira Code", "ui-monospace", "SFMono-Regular"],
      },
      colors: {
        court: "#141414",
        charcoal: "#1e1e1e",
        asphalt: "#252525",
        "asphalt-muted": "#6b6b6b",
        racket: "#e8a020",
        "racket-hover": "#c4851a",
        turf: "#3a7d44",
        ball: "#c8d400",
        "card-bg": "#1e1e1e",
        "border-subtle": "#2e2e2e",
      },
    },
  },
  plugins: [],
};
