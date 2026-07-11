/**
 * Topic accent palette. Validated with the dataviz six-checks validator
 * (lightness band, chroma, CVD separation, surface contrast) against both
 * light and dark surfaces — keep changes in a passing state.
 */
export const TOPIC_COLORS = [
  "#6366f1",
  "#0284c7",
  "#059669",
  "#d97706",
  "#ef4444",
  "#a855f7",
] as const;

export const FALLBACK_TOPIC_COLOR = "#8b8b8b";
