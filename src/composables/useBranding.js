import authService from "@/services/authService.js";

// Default violet theme channels (must match :root in main.css).
const DEFAULT = {
  rgb: "124 92 252",
  hover: "106 71 240",
  second: "168 85 247",
};

/**
 * Parse a hex color (#rgb or #rrggbb) into "r g b" channel triplet.
 *
 * @param {string} hex - Hex color string
 * @returns {string|null} - "r g b" or null if invalid
 */
const hexToChannels = (hex) => {
  if (typeof hex !== "string") return null;
  let value = hex.trim().replace(/^#/, "");
  if (value.length === 3) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return null;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
};

/**
 * Darken a "r g b" channel triplet by a factor (0..1) for the hover shade.
 *
 * @param {string} channels - "r g b"
 * @param {number} [factor=0.88]
 * @returns {string} - Darkened "r g b"
 */
const darken = (channels, factor = 0.88) =>
  channels
    .split(" ")
    .map((n) => Math.max(0, Math.round(Number(n) * factor)))
    .join(" ");

/**
 * Lighten a "r g b" channel triplet toward white for the gradient's 2nd stop.
 *
 * @param {string} channels - "r g b"
 * @param {number} [factor=0.18]
 * @returns {string} - Lightened "r g b"
 */
const lighten = (channels, factor = 0.18) =>
  channels
    .split(" ")
    .map((n) => Math.round(Number(n) + (255 - Number(n)) * factor))
    .join(" ");

/**
 * Pick a readable foreground ("on-accent") color for a given accent so text and
 * icons placed on the accent stay legible — dark ink on light accents, white on
 * dark ones. Uses perceived luminance.
 *
 * @param {string} channels - "r g b"
 * @returns {string} - "#rrggbb" foreground color
 */
const foregroundFor = (channels) => {
  const [r, g, b] = channels.split(" ").map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0a0912" : "#ffffff";
};

/**
 * Apply the given accent color (hex) to the app's CSS accent variables.
 * Falls back to the default theme when the color is missing/invalid.
 *
 * @param {string|null} accentColor - Hex color from the org's branding
 * @returns {void}
 */
export const applyAccent = (accentColor) => {
  const root = document.documentElement;
  const channels = hexToChannels(accentColor);

  if (!channels) {
    root.style.setProperty("--racket-rgb", DEFAULT.rgb);
    root.style.setProperty("--racket-hover-rgb", DEFAULT.hover);
    root.style.setProperty("--racket-2-rgb", DEFAULT.second);
    root.style.setProperty("--racket-fg", "#ffffff");
    return;
  }

  root.style.setProperty("--racket-rgb", channels);
  root.style.setProperty("--racket-hover-rgb", darken(channels));
  root.style.setProperty("--racket-2-rgb", lighten(channels));
  root.style.setProperty("--racket-fg", foregroundFor(channels));
};

/**
 * Reset branding to the default violet theme (e.g. on logout).
 *
 * @returns {void}
 */
export const resetAccent = () => applyAccent(null);

/**
 * Read the current accent channels ("r g b") from the live CSS variables.
 * Useful for canvas/JS contexts (e.g. charts) that can't use CSS classes.
 *
 * @returns {string} - "r g b" channel triplet
 */
export const getAccentChannels = () => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--racket-rgb")
    .trim();
  return value || DEFAULT.rgb;
};

/**
 * The current accent color as an `rgb()` / `rgba()` string.
 *
 * @param {number} [alpha=1] - Opacity 0..1
 * @returns {string}
 */
export const accentColor = (alpha = 1) => {
  const channels = getAccentChannels();
  return alpha >= 1 ? `rgb(${channels})` : `rgb(${channels} / ${alpha})`;
};

/**
 * The lighter accent stop (gradient second stop) as an `rgb()` string.
 *
 * @param {number} [alpha=1] - Opacity 0..1
 * @returns {string}
 */
export const accentColor2 = (alpha = 1) => {
  const channels =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--racket-2-rgb")
      .trim() || DEFAULT.second;
  return alpha >= 1 ? `rgb(${channels})` : `rgb(${channels} / ${alpha})`;
};

/**
 * Apply branding from the currently stored org, if any.
 *
 * @returns {void}
 */
export const applyStoredBranding = () => {
  const org = authService.getOrg();
  applyAccent(org?.accentColor ?? null);
};

/**
 * Install global listeners that keep branding in sync with the active org.
 * Call once at app startup (in App.vue).
 *
 * @returns {() => void} - A cleanup function removing the listeners
 */
export const useBranding = () => {
  const onOrgChanged = (event) => applyAccent(event.detail?.accentColor ?? null);

  applyStoredBranding();
  window.addEventListener("org:changed", onOrgChanged);

  return () => {
    window.removeEventListener("org:changed", onOrgChanged);
  };
};
