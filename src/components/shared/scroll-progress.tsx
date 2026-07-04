"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Fixed top scroll-progress bar. Place once near the root. Uses a spring for
 * smooth trailing. Sits above all content (z-50).
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-[60] h-0.5 origin-left brand-gradient"
    />
  );
}
