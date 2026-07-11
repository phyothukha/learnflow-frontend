"use client";

import { createContext, useContext, useState, type PropsWithChildren } from "react";
import type { Course } from "@/store/server/courses/interface";

type DialogType = "create" | "edit" | "delete" | null;

interface CoursesContextType {
  open: DialogType;
  setOpen: (type: DialogType) => void;
  currentRow: Course | null;
  setCurrentRow: (row: Course | null) => void;
}

const CoursesContext = createContext<CoursesContextType>(null!);

export function CoursesProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState<DialogType>(null);
  const [currentRow, setCurrentRow] = useState<Course | null>(null);

  return (
    <CoursesContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  return useContext(CoursesContext);
}
