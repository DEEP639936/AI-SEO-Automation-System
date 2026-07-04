"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertOctagon, Info } from "lucide-react";

export type Severity = "critical" | "warning" | "info";

const styles: Record<
  Severity,
  { className: string; icon: typeof AlertTriangle; label: string }
> = {
  critical: {
    className:
      "bg-red-500/12 text-red-600 dark:text-red-400 border-red-500/25",
    icon: AlertOctagon,
    label: "Critical",
  },
  warning: {
    className:
      "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/25",
    icon: AlertTriangle,
    label: "Warning",
  },
  info: {
    className:
      "bg-sky-500/12 text-sky-600 dark:text-sky-400 border-sky-500/25",
    icon: Info,
    label: "Info",
  },
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  const s = styles[severity] ?? styles.info;
  const Icon = s.icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 font-medium border", s.className, className)}
    >
      <Icon className="h-3 w-3" />
      {s.label}
    </Badge>
  );
}

export function priorityToSeverity(p: "high" | "medium" | "low"): Severity {
  return p === "high" ? "critical" : p === "medium" ? "warning" : "info";
}
