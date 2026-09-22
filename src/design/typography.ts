/**
 * FAITH design tokens — typography.
 * Hierarchy: Display (wordmark, scores, big rewards) → Heading (screen/section
 * titles) → Body (descriptions) → Caption (labels, metadata, timestamps).
 */
export const typography = {
  display: { fontSize: 40, fontWeight: "800" as const, letterSpacing: 0.5 },
  displaySmall: { fontSize: 28, fontWeight: "800" as const, letterSpacing: 0.5 },
  heading: { fontSize: 20, fontWeight: "700" as const, letterSpacing: 0.3 },
  headingSmall: { fontSize: 16, fontWeight: "700" as const, letterSpacing: 0.3 },
  body: { fontSize: 15, fontWeight: "500" as const },
  bodyStrong: { fontSize: 15, fontWeight: "700" as const },
  caption: { fontSize: 12, fontWeight: "600" as const, letterSpacing: 1 },
  captionSmall: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 0.8 },
};
