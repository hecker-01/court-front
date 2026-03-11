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
        // Dark backgrounds
        court: "#141414",
        charcoal: "#1e1e1e",
        asphalt: "#252525",
        "asphalt-light": "#2e2e2e",
        "asphalt-muted": "#6b6b6b",
        // Brand CTA
        racket: "#3b82f6",
        "racket-hover": "#2563eb",
        // Green / success
        turf: "#3a7d44",
        "turf-hover": "#2d6336",
        // Accent
        ball: "#ff9800",
        // Light text on dark backgrounds
        snow: "#f0f0f0",
        "snow-dim": "#9ca3af",
        // Danger / error
        danger: "#f87171",
        "danger-solid": "#dc2626",
        "danger-hover": "#b91c1c",
        "danger-surface": "#2a1515",
        "danger-border": "#7f1d1d",
        // Order status colors
        "status-pending": "#f59e0b",
        "status-pending-bg": "#2c1f07",
        "status-processing": "#60a5fa",
        "status-processing-bg": "#0c1a2e",
        "status-delivering": "#a78bfa",
        "status-delivering-bg": "#180e30",
        "status-completed": "#34d399",
        "status-completed-bg": "#08231a",
        "status-cancelled": "#f87171",
        "status-cancelled-bg": "#2a1515",
        // Backward-compat aliases
        "card-bg": "#1e1e1e",
        "border-subtle": "#2e2e2e",
      },
    },
  },
  plugins: [],
};
