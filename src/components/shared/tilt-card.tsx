"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * 3D tilt card — tilts toward the cursor on hover with a glare highlight.
 * Subtle, premium micro-interaction. Pointer-events pass through to children.
 */
export function TiltCard({
  children,
  className,
  glare = true,
  max = 8,
}: {
  children: ReactNode;
  className?: string;
  glare?: boolean;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 200, damping: 18 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, o: 0 });

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    px.set(x);
    py.set(y);
    setGlarePos({ x: x * 100, y: y * 100, o: 0.18 });
  }
  function onLeave() {
    px.set(0.5);
    py.set(0.5);
    setGlarePos((g) => ({ ...g, o: 0 }));
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      className={cn("relative", className)}
    >
      {children}
      {glare && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: glarePos.o,
            background: `radial-gradient(220px circle at ${glarePos.x}% ${glarePos.y}%, color-mix(in oklch, var(--foreground) 20%, transparent), transparent 60%)`,
          }}
        />
      )}
    </motion.div>
  );
}
