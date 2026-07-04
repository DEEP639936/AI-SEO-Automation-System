"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor glow — a soft radial highlight that follows the pointer. Fixed to
 * viewport, pointer-events none, blends with `mix-blend-screen` in dark mode
 * for a luminous trail. Disabled on touch devices.
 */
export function CursorGlow({ size = 360 }: { size?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip on touch / small screens.
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;

    function onMove(e: MouseEvent) {
      tx = e.clientX;
      ty = e.clientY;
    }
    function loop() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      el.style.transform = `translate3d(${cx - size / 2}px, ${cy - size / 2}px, 0)`;
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [size]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[55] hidden rounded-full mix-blend-screen dark:block"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle, color-mix(in oklch, var(--primary) 22%, transparent), transparent 65%)",
      }}
    />
  );
}
