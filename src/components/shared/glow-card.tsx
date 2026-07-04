"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * GlowCard — card with an animated gradient border that intensifies on hover
 * and a soft glow. Use anywhere a premium card is needed.
 */
export function GlowCard({
  children,
  className,
  glow = true,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "group relative rounded-xl border border-border/60 bg-card text-card-foreground transition-colors",
        glow && "hover:glow-soft",
        "gradient-border",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
