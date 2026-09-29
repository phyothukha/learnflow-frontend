import { useCallback, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

export enum ConfirmDialogVariant {
  Default = "default",
  Destructive = "destructive",
}

export interface ConfirmDialogOptions {
  title: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  icon?: LucideIcon;
  /**
   * Runs when the user confirms. The dialog stays open with a spinner until it
   * settles, and stays open if it throws so the user can retry or cancel.
   */
  onConfirm?: () => unknown | Promise<unknown>;
  /** Toast shown after `onConfirm` succeeds. */
  successMessage?: string;
  /** Toast shown when `onConfirm` throws. */
  errorMessage?: string;
}

export interface ConfirmDeleteOptions extends Omit<
  ConfirmDialogOptions,
  "title" | "variant"
> {
  /** Name of the thing being deleted, shown in the title. */
  itemName?: string;
  title?: ReactNode;
}

export interface ConfirmDialogProps {
  open: boolean;
  pending: boolean;
  options: ConfirmDialogOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Local state for a `<ConfirmDialog />` rendered by the calling component.
 * Spread `dialogProps` onto it; every open method resolves to `true` when the
 * user confirms.
 */
export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  const settle = (confirmed: boolean) => {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
  };

  const confirm = useCallback((next: ConfirmDialogOptions) => {
    resolveRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      // Let a closing dropdown/menu release its focus + pointer lock first.
      setTimeout(() => {
        setOptions(next);
        setPending(false);
        setOpen(true);
      }, 0);
    });
  }, []);

  const confirmDelete = useCallback(
    ({
      itemName,
      title,
      description = "This action cannot be undone.",
      confirmText = "Delete",
      ...rest
    }: ConfirmDeleteOptions) =>
      confirm({
        title:
          title ?? (itemName ? `Delete "${itemName}"?` : "Delete this item?"),
        description,
        confirmText,
        variant: ConfirmDialogVariant.Destructive,
        ...rest,
      }),
    [confirm],
  );

  const confirmDiscardChanges = useCallback(
    () =>
      confirm({
        title: "Discard unsaved changes?",
        description: "Your edits will be lost.",
        confirmText: "Discard",
        variant: ConfirmDialogVariant.Destructive,
      }),
    [confirm],
  );

  const handleConfirm = async () => {
    if (options?.onConfirm) {
      setPending(true);
      try {
        await options.onConfirm();
      } catch {
        if (options.errorMessage) toast.error(options.errorMessage);
        setPending(false);
        return;
      }
    }
    if (options?.successMessage) toast.success(options.successMessage);
    settle(true);
    setOpen(false);
    setPending(false);
  };

  const handleCancel = () => {
    if (pending) return;
    settle(false);
    setOpen(false);
  };

  const dialogProps: ConfirmDialogProps = {
    open,
    pending,
    options,
    onConfirm: () => void handleConfirm(),
    onCancel: handleCancel,
  };

  return { confirm, confirmDelete, confirmDiscardChanges, dialogProps };
}
