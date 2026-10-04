"use client";

import { cn } from "@/lib/utils";

function isImageLogo(logo: string | null | undefined) {
  if (!logo) return false;
  return (
    logo.startsWith("data:image/") ||
    logo.startsWith("http://") ||
    logo.startsWith("https://") ||
    logo.startsWith("/")
  );
}

interface TeamLogoProps {
  name: string;
  color: string;
  logo?: string | null;
  className?: string;
  textClassName?: string;
}

/** Renders a team logo image, or a color initial when none is set. */
export function TeamLogo({
  name,
  color,
  logo,
  className,
  textClassName,
}: TeamLogoProps) {
  if (isImageLogo(logo)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local/data URL logos
      <img
        src={logo!}
        alt=""
        className={cn("size-8 shrink-0 rounded-lg object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white shadow-sm",
        className,
        textClassName,
      )}
      style={{ backgroundColor: color }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
