"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import posthog from "posthog-js";

interface LogoProps {
  className?: string;
  linkClassName?: string;
  size?: "sm" | "md" | "lg";
  variant?: "header" | "footer";
}

export const Logo: React.FC<LogoProps> = ({
  className,
  linkClassName,
  size = "md",
  variant = "header",
}) => {
  const sizeClasses = {
    sm: "text-lg sm:text-xl md:text-2xl",
    md: "text-xl sm:text-2xl md:text-3xl",
    lg: "text-xl sm:text-2xl md:text-4xl",
  };

  const dotComSizeClasses = {
    sm: "text-xs sm:text-sm md:text-base",
    md: "text-sm sm:text-base md:text-lg",
    lg: "text-sm sm:text-base md:text-lg",
  };

  const handleLogoClick = () => {
    posthog.capture("logo_click", {
      location: variant,
      size: size,
    });
  };

  return (
    <Link
      href="/"
      className={cn("text-left md:text-center", linkClassName)}
      onClick={handleLogoClick}
    >
      <div
        className={cn(
          sizeClasses[size],
          "font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600",
          className
        )}
      >
        AniTorrent
        <span
          className={cn(
            dotComSizeClasses[size],
            "font-normal",
            variant === "header" ? "text-primary-200" : "text-primary-300"
          )}
        >
          .com
        </span>
      </div>
    </Link>
  );
};

export default Logo;
