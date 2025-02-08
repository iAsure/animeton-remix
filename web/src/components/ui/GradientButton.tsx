"use client";

import React from "react";
import { Button, ButtonProps } from "@nextui-org/button";
import { cn } from "@/lib/utils";

interface GradientButtonProps extends ButtonProps {
  gradientFrom?: string;
  gradientTo?: string;
  hoverGradientFrom?: string;
  hoverGradientTo?: string;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  className,
  gradientFrom = "from-primary-700",
  gradientTo = "to-secondary-700",
  hoverGradientFrom = "from-primary-600",
  hoverGradientTo = "to-secondary-600",
  endContent,
  ...props
}) => {
  const baseClassName = "font-bold hover:shadow-xl group relative";
  const gradientClassName = `bg-gradient-to-r ${gradientFrom} ${gradientTo}`;
  const hoverGradientClassName = `${hoverGradientFrom} ${hoverGradientTo}`;

  return (
    <Button
      className={cn(baseClassName, gradientClassName, className)}
      {...props}
      endContent={
        endContent && React.isValidElement(endContent)
          ? React.cloneElement(endContent as React.ReactElement, {
              className: cn(
                "duration-250 ease-in-out group-hover:translate-x-[4px]",
                (endContent as React.ReactElement).props.className
              ),
            })
          : endContent
      }
    >
      <span className="relative z-10 transition-transform duration-300 group-hover:scale-105">
        {children}
      </span>
      <span
        className={cn(
          "absolute bg-gradient-to-r duration-300",
          hoverGradientClassName
        )}
      ></span>
    </Button>
  );
};
