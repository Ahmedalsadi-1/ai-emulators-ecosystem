"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

type KronosLogoProps = {
  size?: number;
  className?: string;
  alt?: string;
  variant?: "light" | "dark" | "auto";
};

export function KronosLogo({
  size = 52,
  className = "",
  alt = "Kronos logo",
  variant = "auto",
}: KronosLogoProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  const getSrc = () => {
    if (variant === "light") return "/kronos-logo.png";
    if (variant === "dark") return "/kronos-logo.png";
    return isDark ? "/kronos-logo.png" : "/kronos-logo.png";
  };

  return (
    <Image
      src={getSrc()}
      alt={alt}
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
