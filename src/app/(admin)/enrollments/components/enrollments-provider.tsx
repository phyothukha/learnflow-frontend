"use client";

import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import type { Enrollment } from "@/store/server/enrollments/interface";

type DialogType = "create" | "edit" | "delete" | null;

export type EnrollmentsDialogType = DialogType;

interface EnrollmentsContextType {
  open: DialogType;
  setOpen: (type: DialogType) => void;
  currentRow: Enrollment | null;
  setCurrentRow: (row: Enrollment | null) => void;
}

const EnrollmentsContext = createContext<EnrollmentsContextType>(null!);

export function EnrollmentsProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState<DialogType>(null);
  const [currentRow, setCurrentRow] = useState<Enrollment | null>(null);

  return (
    <EnrollmentsContext.Provider
      value={{ open, setOpen, currentRow, setCurrentRow }}
    >
      {children}
    </EnrollmentsContext.Provider>
  );
}

export function useEnrollments() {
  return useContext(EnrollmentsContext);
}
