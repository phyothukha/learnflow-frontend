export enum PrimaryColorId {
  Blue = "blue",
  Indigo = "indigo",
  Violet = "violet",
  Emerald = "emerald",
  Rose = "rose",
  Amber = "amber",
}

export interface PrimaryColor {
  label: string;
  value: string;
}

export const PRIMARY_COLORS = new Map<PrimaryColorId, PrimaryColor>([
  [PrimaryColorId.Blue, { label: "Blue", value: "#5992c6" }],
  [PrimaryColorId.Indigo, { label: "Indigo", value: "#6366f1" }],
  [PrimaryColorId.Violet, { label: "Violet", value: "#8b5cf6" }],
  [PrimaryColorId.Emerald, { label: "Emerald", value: "#10b981" }],
  [PrimaryColorId.Rose, { label: "Rose", value: "#f43f5e" }],
  [PrimaryColorId.Amber, { label: "Amber", value: "#f59e0b" }],
]);
