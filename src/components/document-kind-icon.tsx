import Image from "next/image";

import { cn } from "@/lib/utils";
import { KIND_META, type DocumentKind } from "@/lib/document-types";

export interface DocumentKindIconProps {
  kind: DocumentKind;
  size?: number;
  className?: string;
}

export function DocumentKindIcon({
  kind,
  size = 16,
  className,
}: DocumentKindIconProps) {
  const meta = KIND_META[kind];

  if (meta.icon) {
    return (
      <Image
        src={meta.icon}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 object-contain", className)}
        aria-hidden
      />
    );
  }

  const Fallback = meta.fallbackIcon;
  return (
    <Fallback
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
