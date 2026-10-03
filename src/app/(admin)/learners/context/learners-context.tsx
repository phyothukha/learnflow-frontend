"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export enum LearnersDialogType {
  Enroll = "enroll",
}

interface LearnersContextType {
  open: LearnersDialogType | null;
  currentId: string | null;
  openDialog: (type: LearnersDialogType, learnerId?: string) => void;
  closeDialog: () => void;
}

const LearnersContext = createContext<LearnersContextType | null>(null);

export default function LearnersProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState<LearnersDialogType | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);

  return (
    <LearnersContext
      value={{
        open,
        currentId,
        openDialog: (type, learnerId) => {
          setOpen(type);
          setCurrentId(learnerId ?? null);
        },
        closeDialog: () => {
          setOpen(null);
          setCurrentId(null);
        },
      }}
    >
      {children}
    </LearnersContext>
  );
}

export const useLearners = () => {
  const context = useContext(LearnersContext);
  if (!context) {
    throw new Error("useLearners has to be used within <LearnersProvider>");
  }
  return context;
};
