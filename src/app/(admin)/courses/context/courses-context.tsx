"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { Course } from "@/store/server/courses/interface";

export enum CoursesDialogType {
  Create = "create",
  Edit = "edit",
}

interface CoursesContextType {
  open: CoursesDialogType | null;
  setOpen: (type: CoursesDialogType | null) => void;
  currentRow: Course | null;
  setCurrentRow: Dispatch<SetStateAction<Course | null>>;
}

const CoursesContext = createContext<CoursesContextType | null>(null);

interface Props {
  children: ReactNode;
}

export default function CoursesProvider({ children }: Props) {
  const [open, setOpen] = useState<CoursesDialogType | null>(null);
  const [currentRow, setCurrentRow] = useState<Course | null>(null);

  return (
    <CoursesContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </CoursesContext>
  );
}

export const useCourses = () => {
  const coursesContext = useContext(CoursesContext);

  if (!coursesContext) {
    throw new Error("useCourses has to be used within <CoursesProvider>");
  }

  return coursesContext;
};
