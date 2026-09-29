export enum PrimaryColorId {
  Blue = "blue",
  Indigo = "indigo",
  Violet = "violet",
  Emerald = "emerald",
  Rose = "rose",
  Amber = "amber",
}

export interface PrimaryColor {
  id: PrimaryColorId;
  label: string;
  value: string;
}

export const PRIMARY_COLORS: readonly PrimaryColor[] = [
  { id: PrimaryColorId.Blue, label: "Blue", value: "#5992c6" },
  { id: PrimaryColorId.Indigo, label: "Indigo", value: "#6366f1" },
  { id: PrimaryColorId.Violet, label: "Violet", value: "#8b5cf6" },
  { id: PrimaryColorId.Emerald, label: "Emerald", value: "#10b981" },
  { id: PrimaryColorId.Rose, label: "Rose", value: "#f43f5e" },
  { id: PrimaryColorId.Amber, label: "Amber", value: "#f59e0b" },
];

export const DEFAULT_PRIMARY_COLOR: PrimaryColorId = PrimaryColorId.Blue;

export const PRIMARY_COLOR_STORAGE_KEY = "learnflow-primary-color";

const PRIMARY_COLOR_BY_ID = new Map<string, PrimaryColor>(
  PRIMARY_COLORS.map((color) => [color.id, color]),
);

export function isPrimaryColorId(value: unknown): value is PrimaryColorId {
  return typeof value === "string" && PRIMARY_COLOR_BY_ID.has(value);
}

export function applyPrimaryColor(id: PrimaryColorId) {
  const color = PRIMARY_COLOR_BY_ID.get(id) ?? PRIMARY_COLORS[0];
  const root = document.documentElement;
  root.dataset.primary = color.id;
  root.style.setProperty("--primary", color.value);
}

// Plain object on purpose: it is serialised into the inline script, and
// JSON.stringify turns a Map into "{}".
const colorMap = Object.fromEntries(PRIMARY_COLORS.map((c) => [c.id, c.value]));

/** Runs before hydration so the saved color is applied without a flash. */
export const primaryColorInitScript = `(function(){try{var m=${JSON.stringify(
  colorMap,
)};var c=localStorage.getItem(${JSON.stringify(
  PRIMARY_COLOR_STORAGE_KEY,
)});if(!m[c])c=${JSON.stringify(DEFAULT_PRIMARY_COLOR)};var r=document.documentElement;r.dataset.primary=c;r.style.setProperty("--primary",m[c])}catch(e){}})();`;
