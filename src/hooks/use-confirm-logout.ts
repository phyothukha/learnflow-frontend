import { useCallback } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useConfirmDialog } from "./use-confirm-dialog";

export function useConfirmLogout() {
  const { confirm, dialogProps } = useConfirmDialog();

  const confirmLogout = useCallback(
    () =>
      confirm({
        title: "Log out?",
        description: "You'll need to sign in again to access LearnFlow.",
        confirmText: "Log out",
        icon: LogOut,
        onConfirm: () => signOut({ callbackUrl: "/login" }),
      }),
    [confirm],
  );

  return { confirmLogout, dialogProps };
}
