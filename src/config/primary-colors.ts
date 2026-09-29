export const PRIMARY_COLORS = [
  { id: "blue", label: "Blue", value: "#5992c6" },
  { id: "indigo", label: "Indigo", value: "#6366f1" },
  { id: "violet", label: "Violet", value: "#8b5cf6" },
  { id: "emerald", label: "Emerald", value: "#10b981" },
  { id: "rose", label: "Rose", value: "#f43f5e" },
  { id: "amber", label: "Amber", value: "#f59e0b" },
] as const;

export type PrimaryColorId = (typeof PRIMARY_COLORS)[number]["id"];

export const DEFAULT_PRIMARY_COLOR: PrimaryColorId = "blue";

export const PRIMARY_COLOR_STORAGE_KEY = "learnflow-primary-color";

export function isPrimaryColorId(value: unknown): value is PrimaryColorId {
  return PRIMARY_COLORS.some((color) => color.id === value);
}

export function applyPrimaryColor(id: PrimaryColorId) {
  const color = PRIMARY_COLORS.find((c) => c.id === id) ?? PRIMARY_COLORS[0];
  const root = document.documentElement;
  root.dataset.primary = color.id;
  root.style.setProperty("--primary", color.value);
}

const colorMap = Object.fromEntries(PRIMARY_COLORS.map((c) => [c.id, c.value]));

/** Runs before hydration so the saved color is applied without a flash. */
export const primaryColorInitScript = `(function(){try{var m=${JSON.stringify(
  colorMap,
)};var c=localStorage.getItem(${JSON.stringify(
  PRIMARY_COLOR_STORAGE_KEY,
)});if(!m[c])c=${JSON.stringify(DEFAULT_PRIMARY_COLOR)};var r=document.documentElement;r.dataset.primary=c;r.style.setProperty("--primary",m[c])}catch(e){}})();`;
