"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * ProCard — the consistent professional card used across the dashboard.
 * Flat, hairline border, subtle shadow on hover, optional header/title/description.
 * Replaces ad-hoc Card/GlowCard usage for a unified enterprise look.
 */
export function ProCard({
  children,
  className,
  hover = true,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: React.ElementType;
}) {
  return (
    <Tag
      className={cn(
        "relative rounded-xl border border-border/70 bg-card text-card-foreground shadow-xs-pro",
        hover && "transition-all duration-200 hover:border-border hover:shadow-md-pro",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function ProCardHeader({
  title,
  description,
  icon,
  action,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4",
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {title && (
            <h3 className="text-sm font-semibold tracking-tight truncate">{title}</h3>
          )}
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function ProCardFooter({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-t border-border/60 px-5 py-3",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Animated entrance variant for pro cards in a grid. */
export function ProCardMotion({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
