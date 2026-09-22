/**
 * FAITH design tokens — colors.
 * Centralized so the palette can change globally without hunting through screens.
 */
export const colors = {
  background: "#08090D",
  surface: "#11141A",
  surfaceElevated: "#181C24",

  textPrimary: "#FFFFFF",
  textSecondary: "#9CA3AF",
  textMuted: "#626875",

  accent: "#00E5A0",
  accentSecondary: "#5B8CFF",

  success: "#00E5A0",
  warning: "#FFC857",
  danger: "#FF4D67",

  border: "rgba(255,255,255,0.08)",
} as const;

export type ColorToken = keyof typeof colors;
