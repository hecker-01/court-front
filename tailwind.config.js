/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        serif: ["serif"],
        mono: ["ui-monospace", "monospace"],
      },
      colors: {
        // Page + surfaces (deep navy/violet glass)
        court: "#0a0912",
        charcoal: "#16131f",
        asphalt: "#211d2e",
        "asphalt-light": "#2e2840",
        "asphalt-muted": "#7a738f",
        // Primary accent (violet) — driven by CSS vars so org branding can
        // re-theme the app at runtime (see useBranding composable).
        racket: "rgb(var(--racket-rgb) / <alpha-value>)",
        "racket-hover": "rgb(var(--racket-hover-rgb) / <alpha-value>)",
        turf: "#34d399",
        "turf-hover": "#10b981",
        ball: "#fbbf24",
        snow: "#f4f3fb",
        "snow-dim": "#9b94b8",
        danger: "#fb7185",
        "danger-solid": "#e11d48",
        "danger-hover": "#be123c",
        "danger-surface": "#2a151f",
        "danger-border": "#7f1d3a",
        // game status colors. The violet-family statuses (planned/ended) are
        // accent-driven so no default purple remains when an org rebrands.
        "status-pending": "#fbbf24",
        "status-pending-bg": "#2c2207",
        "status-playing": "rgb(var(--racket-rgb) / <alpha-value>)",
        "status-playing-bg": "rgb(var(--racket-rgb) / 0.12)",
        "status-delivering": "rgb(var(--racket-2-rgb) / <alpha-value>)",
        "status-ended-bg": "rgb(var(--racket-2-rgb) / 0.12)",
        "status-processed": "#34d399",
        "status-processed-bg": "#0c2620",
        "status-cancelled": "#fb7185",
        "status-cancelled-bg": "#2a151f",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        md: "0.875rem",
        lg: "1.25rem",
        xl: "1.5rem",
        "2xl": "1.75rem",
        "3xl": "2.25rem",
      },
      boxShadow: {
        glow: "0 10px 40px -12px rgb(var(--racket-rgb) / 0.45)",
        "glow-sm": "0 6px 20px -8px rgb(var(--racket-rgb) / 0.5)",
        card: "0 8px 30px -12px rgba(0, 0, 0, 0.6)",
      },
      backgroundImage: {
        "violet-grad":
          "linear-gradient(135deg, rgb(var(--racket-rgb)) 0%, rgb(var(--racket-2-rgb)) 100%)",
        "violet-soft":
          "linear-gradient(160deg, rgb(var(--racket-rgb) / 0.18) 0%, rgb(var(--racket-rgb) / 0.04) 100%)",
      },
    },
  },
  plugins: [],
};
