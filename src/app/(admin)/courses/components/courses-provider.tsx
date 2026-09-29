"use client";

import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import type { Course } from "@/store/server/courses/interface";
import type { CoursesDialogType } from "./courses-columns.props";

interface CoursesContextType {
  open: CoursesDialogType | null;
  setOpen: (type: CoursesDialogType | null) => void;
  currentRow: Course | null;
  setCurrentRow: (row: Course | null) => void;
}

const CoursesContext = createContext<CoursesContextType>(null!);

export function CoursesProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState<CoursesDialogType | null>(null);
  const [currentRow, setCurrentRow] = useState<Course | null>(null);

  return (
    <CoursesContext.Provider
      value={{ open, setOpen, currentRow, setCurrentRow }}
    >
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  return useContext(CoursesContext);
}
