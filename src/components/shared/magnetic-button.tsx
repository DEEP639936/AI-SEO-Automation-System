"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Magnetic button — the element subtly follows the cursor while hovered,
 * creating a premium "magnetic" pull. Wrap any clickable content.
 */
export function MagneticButton({
  children,
  className,
  strength = 0.35,
  as: Comp = "button",
  ...props
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  as?: React.ElementType;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setOffset({ x: x * strength, y: y * strength });
  }
  function onLeave() {
    setOffset({ x: 0, y: 0 });
  }

  return (
    <motion.div
      style={{ display: "inline-block" }}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.4 }}
    >
      <Comp
        ref={ref as React.RefObject<HTMLElement>}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={cn(className)}
        {...props}
      >
        {children}
      </Comp>
    </motion.div>
  );
}
