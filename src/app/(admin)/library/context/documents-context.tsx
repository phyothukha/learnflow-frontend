"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { StudyDocument } from "@/store/server/documents/interface";

export enum DocumentsDialogType {
  Settings = "settings",
}

interface DocumentsContextType {
  open: DocumentsDialogType | null;
  setOpen: (type: DocumentsDialogType | null) => void;
  currentRow: StudyDocument | null;
  setCurrentRow: Dispatch<SetStateAction<StudyDocument | null>>;
}

const DocumentsContext = createContext<DocumentsContextType | null>(null);

interface Props {
  children: ReactNode;
}

export default function DocumentsProvider({ children }: Props) {
  const [open, setOpen] = useState<DocumentsDialogType | null>(null);
  const [currentRow, setCurrentRow] = useState<StudyDocument | null>(null);

  return (
    <DocumentsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </DocumentsContext>
  );
}

export const useDocuments = () => {
  const documentsContext = useContext(DocumentsContext);

  if (!documentsContext) {
    throw new Error("useDocuments has to be used within <DocumentsProvider>");
  }

  return documentsContext;
};
