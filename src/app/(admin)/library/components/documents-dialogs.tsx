"use client";

import {
  DocumentsDialogType,
  useDocuments,
} from "../context/documents-context";
import { DocumentDetailDialog } from "./document-detail-dialog";

export function DocumentsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useDocuments();

  if (open !== DocumentsDialogType.Settings || !currentRow) return null;

  return (
    <DocumentDetailDialog
      key={currentRow.Id}
      document={currentRow}
      onClose={() => {
        setOpen(null);
        setCurrentRow(null);
      }}
    />
  );
}
