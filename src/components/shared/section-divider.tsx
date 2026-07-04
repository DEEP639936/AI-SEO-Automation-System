"use client";

import { motion } from "framer-motion";

/**
 * Animated section divider — a gradient line that draws itself in on scroll,
 * with a glowing center node. Use between major landing sections.
 */
export function SectionDivider({ className }: { className?: string }) {
  return (
    <div className={"relative flex items-center justify-center py-2 " + (className ?? "")}>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="h-px w-full max-w-md origin-center bg-gradient-to-r from-transparent via-border to-transparent"
      />
      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute h-2 w-2 rounded-full brand-gradient glow-primary"
      />
    </div>
  );
}
