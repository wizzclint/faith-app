/**
 * FAITH design tokens — colors.
 * Centralized so the palette can change globally without hunting through screens.
 * Values are sampled from the neon mockups in art-source/mockups/.
 */
export const colors = {
  background: "#050B0F",
  surface: "#0A1419",
  surfaceElevated: "#0E1B22",

  textPrimary: "#FFFFFF",
  textSecondary: "#93A3AD",
  textMuted: "#5E6E78",

  accent: "#00E2AE",
  accentBright: "#40FBC9",
  /** Dark teal for icon tiles and chips sitting on a surface. */
  accentDeep: "#03312C",
  /** Text and icons placed on top of the accent color. */
  accentInk: "#03211B",
  accentSecondary: "#5B8CFF",

  success: "#00E2AE",
  warning: "#FFC857",
  danger: "#FF4D67",
  fire: "#FF8A3D",

  border: "rgba(110,231,200,0.14)",
  borderStrong: "rgba(0,226,174,0.55)",
  /** Empty part of a progress bar. */
  track: "#17272F",
} as const;

export type ColorToken = keyof typeof colors;
