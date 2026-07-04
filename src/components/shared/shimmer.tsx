"use client";

import { cn } from "@/lib/utils";

/**
 * Shimmer skeleton — drop-in replacement for <Skeleton> with a sweeping
 * shimmer animation. Pass className for sizing.
 */
export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-md", className)} />;
}
