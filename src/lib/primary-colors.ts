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
  [PrimaryColorId.Blue, { label: "Blue", value: "#0a7cff" }],
  [PrimaryColorId.Indigo, { label: "Indigo", value: "#4f46e5" }],
  [PrimaryColorId.Violet, { label: "Violet", value: "#8b2cf5" }],
  [PrimaryColorId.Emerald, { label: "Emerald", value: "#00b377" }],
  [PrimaryColorId.Rose, { label: "Rose", value: "#ff2d55" }],
  [PrimaryColorId.Amber, { label: "Amber", value: "#ff9500" }],
]);
