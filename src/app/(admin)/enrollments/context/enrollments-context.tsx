"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { Enrollment } from "@/store/server/enrollments/interface";

export enum EnrollmentsDialogType {
  Create = "create",
  Edit = "edit",
}

interface EnrollmentsContextType {
  open: EnrollmentsDialogType | null;
  setOpen: (type: EnrollmentsDialogType | null) => void;
  currentRow: Enrollment | null;
  setCurrentRow: Dispatch<SetStateAction<Enrollment | null>>;
}

const EnrollmentsContext = createContext<EnrollmentsContextType | null>(null);

interface Props {
  children: ReactNode;
}

export default function EnrollmentsProvider({ children }: Props) {
  const [open, setOpen] = useState<EnrollmentsDialogType | null>(null);
  const [currentRow, setCurrentRow] = useState<Enrollment | null>(null);

  return (
    <EnrollmentsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </EnrollmentsContext>
  );
}

export const useEnrollments = () => {
  const enrollmentsContext = useContext(EnrollmentsContext);

  if (!enrollmentsContext) {
    throw new Error(
      "useEnrollments has to be used within <EnrollmentsProvider>",
    );
  }

  return enrollmentsContext;
};
