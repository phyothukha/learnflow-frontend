import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Topic accent palette. Validated with the dataviz six-checks validator
 * (lightness band, chroma, CVD separation, surface contrast) against both
 * light and dark surfaces — keep changes in a passing state.
 */
export const TOPIC_COLORS = new Map<string, string>([
  ["Indigo", "#6366f1"],
  ["Sky", "#0284c7"],
  ["Emerald", "#059669"],
  ["Amber", "#d97706"],
  ["Red", "#ef4444"],
  ["Purple", "#a855f7"],
]);

export const DEFAULT_TOPIC_COLOR = "#6366f1";
export const FALLBACK_TOPIC_COLOR = "#8b8b8b";

export const FOLDER_COLORS = new Map<string, string>([
  ["Blue", "#3b82f6"],
  ["Indigo", "#6366f1"],
  ["Sky", "#0ea5e9"],
  ["Yellow", "#eab308"],
  ["Green", "#22c55e"],
  ["Orange", "#f97316"],
  ["Pink", "#ec4899"],
  ["Teal", "#14b8a6"],
]);

export const ALL_FILES_COLOR = "#6366f1";

const FOLDER_COLOR_VALUES = Array.from(FOLDER_COLORS.values());

/** Stable color for a folder, derived from its id. */
export function folderColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return FOLDER_COLOR_VALUES[Math.abs(hash) % FOLDER_COLOR_VALUES.length];
}
