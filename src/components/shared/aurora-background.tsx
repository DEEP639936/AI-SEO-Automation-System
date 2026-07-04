"use client";

/**
 * Ambient animated aurora background — large blurred gradient orbs that
 * slowly drift behind content. Fixed to viewport so it persists across
 * client-side view changes. Pointer-events none so it never blocks UI.
 */
export function AuroraBackground({ variant = "default" }: { variant?: "default" | "subtle" }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* base wash */}
      <div
        className={
          "absolute inset-0 " +
          (variant === "subtle" ? "opacity-60" : "opacity-100")
        }
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, color-mix(in oklch, var(--primary) 12%, transparent), transparent 60%)",
        }}
      />
      {/* drifting orbs */}
      <div
        className="absolute -top-32 -left-24 h-[42rem] w-[42rem] rounded-full blur-[120px] animate-aurora"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--primary) 40%, transparent), transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/3 -right-32 h-[38rem] w-[38rem] rounded-full blur-[120px] animate-aurora"
        style={{
          animationDelay: "-7s",
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--chart-2) 38%, transparent), transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-40 left-1/4 h-[36rem] w-[36rem] rounded-full blur-[120px] animate-aurora"
        style={{
          animationDelay: "-14s",
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--chart-4) 26%, transparent), transparent 70%)",
        }}
      />
      {/* subtle dot grid overlay */}
      <div className="absolute inset-0 dot-grid opacity-50" />
    </div>
  );
}
