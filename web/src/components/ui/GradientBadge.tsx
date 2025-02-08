"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BetaBadgeProps {
  text: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const BetaBadge: React.FC<BetaBadgeProps> = ({
  text,
  className,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1",
  };

  return (
    <span
      className={`p-[2px] relative rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 ${size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"}`}
    >
      <span
        className={cn(
          `inline-block font-bold rounded-md ${sizeClasses[size]}`,
          "bg-background backdrop-blur-md",
          className
        )}
      >
        <span className="relative text-bolder z-10 bg-clip-text text-transparent text-white">
          {text}
        </span>
      </span>
    </span>
  );
};

export default BetaBadge;
