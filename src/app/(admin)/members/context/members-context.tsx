"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export enum MembersDialogType {
  Enroll = "enroll",
}

interface MembersContextType {
  open: MembersDialogType | null;
  currentId: string | null;
  openDialog: (type: MembersDialogType, memberId?: string) => void;
  closeDialog: () => void;
}

const MembersContext = createContext<MembersContextType | null>(null);

export default function MembersProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<MembersDialogType | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);

  return (
    <MembersContext
      value={{
        open,
        currentId,
        openDialog: (type, memberId) => {
          setOpen(type);
          setCurrentId(memberId ?? null);
        },
        closeDialog: () => {
          setOpen(null);
          setCurrentId(null);
        },
      }}
    >
      {children}
    </MembersContext>
  );
}

export const useMembers = () => {
  const context = useContext(MembersContext);
  if (!context) {
    throw new Error("useMembers has to be used within <MembersProvider>");
  }
  return context;
};
