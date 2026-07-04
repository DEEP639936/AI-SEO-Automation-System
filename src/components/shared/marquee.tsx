"use client";

import { cn } from "@/lib/utils";

/**
 * Infinite marquee — duplicates children and slides left. Pause on hover.
 */
export function Marquee({
  children,
  className,
  reverse = false,
}: {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
}) {
  return (
    <div className={cn("group relative flex overflow-hidden", className)}>
      <div
        className="flex shrink-0 items-center gap-12 pr-12 animate-marquee group-hover:[animation-play-state:paused]"
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="flex shrink-0 items-center gap-12 pr-12 animate-marquee group-hover:[animation-play-state:paused]"
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {children}
      </div>
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
