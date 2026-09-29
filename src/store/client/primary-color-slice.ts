import Cookies from "js-cookie";
import type { StateCreator } from "zustand";
import { PRIMARY_COLORS, PrimaryColorId } from "@/lib/primary-colors";

export const PRIMARY_COLOR_COOKIE = "learnflow-primary-color";
export const DEFAULT_PRIMARY_COLOR = PrimaryColorId.Blue;

export function isPrimaryColorId(value: unknown): value is PrimaryColorId {
  return (
    typeof value === "string" && PRIMARY_COLORS.has(value as PrimaryColorId)
  );
}

export function resolvePrimaryColorId(value: unknown): PrimaryColorId {
  return isPrimaryColorId(value) ? value : DEFAULT_PRIMARY_COLOR;
}

export function applyPrimaryColor(id: PrimaryColorId) {
  const resolvedId = resolvePrimaryColorId(id);
  const color = PRIMARY_COLORS.get(resolvedId);
  const root = document.documentElement;
  root.dataset.primary = resolvedId;
  if (color) root.style.setProperty("--primary", color.value);
}

export interface PrimaryColorSlice {
  primaryColor: PrimaryColorId;
  setPrimaryColor: (id: PrimaryColorId) => void;
}

const createPrimaryColorSlice: StateCreator<PrimaryColorSlice> = (set) => ({
  primaryColor: resolvePrimaryColorId(Cookies.get(PRIMARY_COLOR_COOKIE)),
  setPrimaryColor: (id) => {
    const resolvedId = resolvePrimaryColorId(id);
    Cookies.set(PRIMARY_COLOR_COOKIE, resolvedId, {
      expires: 365,
      path: "/",
      sameSite: "lax",
    });
    applyPrimaryColor(resolvedId);
    set({ primaryColor: resolvedId });
  },
});

export default createPrimaryColorSlice;
