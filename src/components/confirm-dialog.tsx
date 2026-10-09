"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ConfirmDialogVariant,
  type ConfirmDialogProps,
} from "@/hooks/use-confirm-dialog";
import { cn } from "@/lib/utils";

/** Render with the `dialogProps` returned by `useConfirmDialog()`. */
export function ConfirmDialog({
  open,
  pending,
  options,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const destructive = options?.variant === ConfirmDialogVariant.Destructive;
  const Icon = options?.icon ?? (destructive ? TriangleAlert : null);

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent className="sm:max-w-xl">
        <AlertDialogHeader className="sm:flex sm:items-start sm:gap-4">
          {Icon && (
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                destructive
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary",
              )}
            >
              <Icon className="size-5" />
            </div>
          )}
          <div className="space-y-1.5">
            <AlertDialogTitle>{options?.title}</AlertDialogTitle>
            {options?.description && (
              <AlertDialogDescription>
                {options.description}
              </AlertDialogDescription>
            )}
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="ghost" disabled={pending}>
            {options?.cancelText ?? "Cancel"}
          </AlertDialogCancel>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={onConfirm}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {options?.confirmText ?? "Confirm"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
