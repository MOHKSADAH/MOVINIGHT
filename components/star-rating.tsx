"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  max?: number;
}

const SIZE_CLASSES = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
} as const;

export function StarRating({
  value = 0,
  onChange,
  readonly = false,
  size = "md",
  max = 5,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const display = hovered ?? value;

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHovered(null)}
      role={readonly ? "img" : "group"}
      aria-label={readonly ? `${value} out of ${max}` : undefined}
    >
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        const filled = starValue <= display;

        return (
          <button
            key={starValue}
            type="button"
            disabled={readonly}
            aria-label={`${starValue} out of ${max}`}
            aria-pressed={!readonly ? starValue <= value : undefined}
            className={cn(
              "transition-transform",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default",
            )}
            onMouseEnter={() => !readonly && setHovered(starValue)}
            onClick={() => !readonly && onChange?.(starValue)}
          >
            <svg
              viewBox="0 0 24 24"
              className={cn(
                SIZE_CLASSES[size],
                filled
                  ? "fill-yellow-500 text-yellow-500"
                  : "fill-muted text-muted-foreground",
                "transition-colors",
              )}
              aria-hidden
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
      {value > 0 && (
        <span className="ms-1.5 text-sm font-medium text-muted-foreground">
          {value}/{max}
        </span>
      )}
    </div>
  );
}
