"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSeoAnalysis, type SeoPillar, type SeoCheck } from "@/hooks/use-api";
import { useUI } from "@/lib/store";
import { PageHeader } from "@/components/shared/page-header";
import { ProCard } from "@/components/shared/pro-card";
import { ScoreRing } from "@/components/shared/score-ring";
import { EmptyState } from "@/components/shared/empty-state";
import { Shimmer } from "@/components/shared/shimmer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Link2,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  ArrowRight,
  Info,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PILLAR_ICONS = {
  "on-page": FileText,
  "off-page": Link2,
  technical: Wrench,
} as const;

const PILLAR_COLORS = {
  "on-page": "#3b82f6",
  "off-page": "#8b5cf6",
  technical: "#10b981",
} as const;

export function SeoAnalysisView() {
  const { selectedSiteId, setView } = useUI();
  const analysisQ = useSeoAnalysis(selectedSiteId);

  if (!selectedSiteId) {
    return (
      <>
        <PageHeader
          title="SEO Analysis"
          description="On-Page, Off-Page & Technical SEO breakdown for your site."
        />
        <EmptyState
          icon={Globe}
          title="Select a site first"
          description="Choose a site from the sidebar to see its 3-pillar SEO analysis."
          action={
            <Button onClick={() => setView("sites")}>Go to sites</Button>
          }
        />
      </>
    );
  }

  const data = analysisQ.data?.analysis;

  return (
    <>
      <PageHeader
        title="SEO Analysis"
        description="A complete breakdown across the three pillars of SEO."
      />

      {analysisQ.isLoading ? (
        <div className="space-y-4">
          <Shimmer className="h-32 w-full rounded-xl" />
          <div className="grid gap-4 lg:grid-cols-3">
            <Shimmer className="h-64 rounded-xl" />
            <Shimmer className="h-64 rounded-xl" />
            <Shimmer className="h-64 rounded-xl" />
          </div>
        </div>
      ) : analysisQ.isError ? (
        <EmptyState
          icon={Globe}
          title="No analysis available"
          description={
            (analysisQ.error as Error)?.message?.includes("no_audit")
              ? "Run a crawl first to generate the SEO analysis."
              : "Something went wrong loading the analysis. Try again."
          }
          action={
            <Button onClick={() => setView("sites")}>
              Go to Sites & Audits
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        />
      ) : data ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-5"
        >
          {/* Overall score + summary */}
          <ProCard hover={false}>
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
              <div className="flex shrink-0 items-center justify-center">
                <ScoreRing score={data.overallScore} size={140} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-eyebrow text-muted-foreground">
                    Overall SEO Health
                  </span>
                  <Badge
                    variant="outline"
                    className="gap-1 text-[10px]"
                  >
                    <TrendingUp className="h-3 w-3" />
                    {data.pillars.length} pillars analyzed
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-foreground">
                  {data.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.pillars.map((p) => (
                    <span
                      key={p.id}
                      className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 text-xs"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: PILLAR_COLORS[p.id] }}
                      />
                      <span className="font-medium">{p.name}</span>
                      <span
                        className={cn(
                          "font-bold tabular-nums",
                          p.score >= 80
                            ? "text-emerald-500"
                            : p.score >= 50
                            ? "text-amber-500"
                            : "text-red-500"
                        )}
                      >
                        {p.score}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </ProCard>

          {/* 3 pillar cards */}
          <div className="grid gap-5 lg:grid-cols-3">
            {data.pillars.map((pillar, i) => (
              <PillarCard key={pillar.id} pillar={pillar} delay={i * 0.08} />
            ))}
          </div>

          {/* info note */}
          <div className="flex items-start gap-2 rounded-lg border border-sky-500/30 bg-sky-500/8 px-4 py-3 text-xs text-sky-600 dark:text-sky-400">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">How these scores are calculated</p>
              <p className="mt-1 leading-relaxed">
                Each pillar is scored 0–100 from weighted checks. <strong>On-Page</strong> analyzes
                titles, meta descriptions, headings, and alt text from the crawl.{" "}
                <strong>Technical</strong> checks HTTPS, mobile-friendliness, page speed, and
                broken links. <strong>Off-Page</strong> estimates social-readiness (OG/Twitter
                tags, canonicals, internal links) — connect SEMrush or Ahrefs for real backlink
                data.
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </>
  );
}

/* ---------------- Pillar card ---------------- */

function PillarCard({ pillar, delay }: { pillar: SeoPillar; delay: number }) {
  const Icon = PILLAR_ICONS[pillar.id];
  const color = PILLAR_COLORS[pillar.id];
  const [expanded, setExpanded] = useState(false);

  const passCount = pillar.checks.filter((c) => c.status === "pass").length;
  const warnCount = pillar.checks.filter((c) => c.status === "warn").length;
  const failCount = pillar.checks.filter((c) => c.status === "fail").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <ProCard className="h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/60 p-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{pillar.name}</h3>
              <p className="text-[11px] text-muted-foreground">
                {passCount} pass · {warnCount} warn · {failCount} fail
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color }}
            >
              {pillar.score}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>

        {/* Description */}
        <div className="px-5 pt-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {pillar.description}
          </p>
        </div>

        {/* Mini score bar */}
        <div className="px-5 pt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pillar.score}%` }}
              transition={{ duration: 0.8, delay: delay + 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>

        {/* Checks list */}
        <div className="p-5">
          <div className="space-y-2">
            {pillar.checks.map((check, idx) => (
              <CheckRow key={check.id} check={check} delay={delay + idx * 0.04} />
            ))}
          </div>
        </div>

        {/* Issues (if any) */}
        {pillar.issues.length > 0 && (
          <>
            <Separator />
            <div className="p-5 pt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center justify-between text-left text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <span>
                  {pillar.issues.length} crawl issues related to {pillar.name}
                </span>
                <ArrowRight
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    expanded && "rotate-90"
                  )}
                />
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 max-h-48 overflow-y-auto space-y-1.5"
                  >
                    {pillar.issues.slice(0, 12).map((issue, idx) => (
                      <li
                        key={idx}
                        className="rounded-md border border-border/50 bg-muted/20 px-2.5 py-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 text-[10px]",
                              issue.severity === "critical" &&
                                "border-red-500/30 bg-red-500/10 text-red-500",
                              issue.severity === "warning" &&
                                "border-amber-500/30 bg-amber-500/10 text-amber-500",
                              issue.severity === "info" &&
                                "border-sky-500/30 bg-sky-500/10 text-sky-500"
                            )}
                          >
                            {issue.severity}
                          </Badge>
                          <span className="truncate font-mono text-[11px]">
                            {issue.type}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground" title={issue.url}>
                          {issue.url}
                        </p>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </ProCard>
    </motion.div>
  );
}

/* ---------------- Check row ---------------- */

function CheckRow({ check, delay }: { check: SeoCheck; delay: number }) {
  const Icon =
    check.status === "pass"
      ? CheckCircle2
      : check.status === "warn"
      ? AlertTriangle
      : XCircle;
  const color =
    check.status === "pass"
      ? "text-emerald-500"
      : check.status === "warn"
      ? "text-amber-500"
      : "text-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-start gap-2.5"
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", color)} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium leading-snug">{check.label}</p>
        <p className="text-[11px] leading-snug text-muted-foreground">
          {check.detail}
        </p>
      </div>
    </motion.div>
  );
}
