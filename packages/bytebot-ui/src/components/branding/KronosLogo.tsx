"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

type KronosLogoProps = {
  size?: number;
  className?: string;
  alt?: string;
};

export function KronosLogo({
  size = 52,
  className = "",
  alt = "Kronos logo",
}: KronosLogoProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Image
      src="/kronos-logo.png"
      alt={alt}
      width={size}
      height={size}
      className={`${className} ${isDark ? "" : "invert"}`}
      priority
    />
  );
}
