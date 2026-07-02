"use client";

import { motion } from "framer-motion";
import {
  useSites,
  useLatestAudit,
  useRankings,
  useAnalyzeAudit,
  type AuditIssue,
} from "@/hooks/use-api";
import { useUI } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreRing } from "@/components/shared/score-ring";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { SeverityBadge, priorityToSeverity } from "@/components/shared/severity-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Markdown } from "@/components/shared/markdown";
import { PageHeader } from "@/components/shared/page-header";
import {
  Globe,
  Bug,
  TrendingUp,
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  Info,
  Wand2,
  Loader2,
  ArrowRight,
  Target,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

export function OverviewView() {
  const { selectedSiteId, setView } = useUI();
  const sitesQ = useSites();
  const auditQ = useLatestAudit(selectedSiteId);
  const rankingsQ = useRankings(selectedSiteId);

  const sites = sitesQ.data?.sites ?? [];

  // No sites at all
  if (!sitesQ.isLoading && sites.length === 0) {
    return (
      <PageHeader
        title="Overview"
        description="Your SEO command center at a glance."
      >
        <EmptyState
          icon={Globe}
          title="No sites yet"
          description="Add your first website to start running automated SEO audits, track rankings, and generate AI content."
          action={
            <Button onClick={() => setView("sites")}>
              Add your first site
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        />
      </PageHeader>
    );
  }

  // No site selected
  if (!selectedSiteId) {
    return (
      <>
        <PageHeader
          title="Overview"
          description="Your SEO command center at a glance."
        />
        <AllSitesOverview />
      </>
    );
  }

  const audit = auditQ.data?.audit ?? null;
  const issues = audit?.issues ?? [];
  const counts = audit?.summary?.counts ?? { critical: 0, warning: 0, info: 0 };

  return (
    <>
      <PageHeader
        title="Overview"
        description={sites.find((s) => s.id === selectedSiteId)?.name}
        action={
          <Button variant="outline" onClick={() => setView("sites")}>
            <Globe className="h-4 w-4" />
            Manage sites
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* score card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Site Health
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 pt-2">
            {auditQ.isLoading ? (
              <Skeleton className="h-32 w-32 rounded-full" />
            ) : audit ? (
              <>
                <ScoreRing score={audit.score} />
                <p className="text-center text-xs text-muted-foreground">
                  Based on last crawl{" "}
                  {new Date(audit.runAt).toLocaleDateString()}
                  <br />
                  {audit.pagesCrawled} pages · {issues.length} issues found
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Bug className="h-7 w-7" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No audit yet. Run your first crawl.
                </p>
                <Button onClick={() => setView("sites")}>
                  Run a crawl
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-2 lg:grid-cols-2">
          <StatCard
            icon={AlertOctagon}
            label="Critical issues"
            value={counts.critical}
            tone="red"
            loading={auditQ.isLoading}
          />
          <StatCard
            icon={AlertTriangle}
            label="Warnings"
            value={counts.warning}
            tone="amber"
            loading={auditQ.isLoading}
          />
          <StatCard
            icon={Target}
            label="Keywords tracked"
            value={(rankingsQ.data?.keywords ?? []).length}
            tone="blue"
            loading={rankingsQ.isLoading}
          />
          <StatCard
            icon={Info}
            label="Info / notices"
            value={counts.info}
            tone="sky"
            loading={auditQ.isLoading}
          />
        </div>
      </div>

      {/* ranking trend + top issues */}
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Ranking trend
            </CardTitle>
            <CardDescription>
              Average position across tracked keywords (lower is better)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RankingTrendChart
              keywords={rankingsQ.data?.keywords ?? []}
              loading={rankingsQ.isLoading}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bug className="h-4 w-4 text-primary" />
              Top issues
            </CardTitle>
            <CardDescription>Most recent crawl findings</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <TopIssues issues={issues} loading={auditQ.isLoading} onViewAll={() => setView("sites")} />
          </CardContent>
        </Card>
      </div>

      {/* AI recommendations */}
      <AIRecommendationsCard siteId={selectedSiteId} hasAudit={!!audit} />
    </>
  );
}

/* ---------------- All-sites overview (no site selected) ---------------- */
function AllSitesOverview() {
  const { setSelectedSiteId, setView } = useUI();
  const sitesQ = useSites();
  const sites = sitesQ.data?.sites ?? [];

  const totalIssues = sites.reduce(
    (sum, s) => sum + (s.audits?.[0] ? 1 : 0),
    0
  );
  const audited = sites.filter((s) => s.audits?.length);
  const avgScore = audited.length
    ? Math.round(
        audited.reduce((sum, s) => sum + (s.audits![0].score || 0), 0) /
          audited.length
      )
    : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Globe} label="Sites" value={sites.length} tone="blue" loading={sitesQ.isLoading} />
        <StatCard icon={Bug} label="Audits run" value={totalIssues} tone="sky" loading={sitesQ.isLoading} />
        <StatCard icon={TrendingUp} label="Avg health" value={avgScore ?? 0} tone={avgScore == null ? "muted" : avgScore >= 80 ? "green" : avgScore >= 50 ? "amber" : "red"} loading={sitesQ.isLoading} format={avgScore == null ? () => "—" : undefined} />
        <StatCard icon={Target} label="Total keywords" value={sites.reduce((a, s) => a + (s._count?.keywords ?? 0), 0)} tone="blue" loading={sitesQ.isLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your sites</CardTitle>
          <CardDescription>Pick one to see its detailed SEO health.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {sites.map((s) => {
            const score = s.audits?.[0]?.score;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedSiteId(s.id);
                  setView("overview");
                }}
                className="group flex items-center justify-between rounded-xl border border-border/70 bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.url}</p>
                </div>
                <div className="ml-3 flex flex-col items-end">
                  <span
                    className={
                      "text-xl font-bold tabular-nums " +
                      (score == null
                        ? "text-muted-foreground"
                        : score >= 80
                        ? "text-emerald-500"
                        : score >= 50
                        ? "text-amber-500"
                        : "text-red-500")
                    }
                  >
                    {score ?? "—"}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    score
                  </span>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Ranking trend chart ---------------- */
function RankingTrendChart({
  keywords,
  loading,
}: {
  keywords: { keyword: string; series: { date: string; position: number }[] }[];
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!keywords.length)
    return (
      <EmptyState
        icon={TrendingUp}
        title="No keywords tracked"
        description="Add target keywords to see ranking trends over time."
        className="h-64"
      />
    );

  // build merged series: average position per date
  const byDate = new Map<string, { sum: number; n: number }>();
  for (const k of keywords) {
    for (const p of k.series) {
      const cur = byDate.get(p.date) ?? { sum: 0, n: 0 };
      cur.sum += p.position;
      cur.n += 1;
      byDate.set(p.date, cur);
    }
  }
  const data = [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({
      date: date.slice(5),
      avg: Number((v.sum / v.n).toFixed(1)),
    }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="rankGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/30" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
          <YAxis
            reversed
            domain={[1, "dataMax + 2"]}
            tick={{ fontSize: 11 }}
            stroke="currentColor"
            className="text-muted-foreground"
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
            formatter={(v: number) => [`#${v}`, "Avg position"]}
          />
          <ReferenceLine y={10} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Line
            type="monotone"
            dataKey="avg"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#3b82f6" }}
            activeDot={{ r: 5 }}
            name="Avg position"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- Top issues ---------------- */
function TopIssues({
  issues,
  loading,
  onViewAll,
}: {
  issues: AuditIssue[];
  loading: boolean;
  onViewAll: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (!issues.length) {
    return (
      <div className="px-4 pb-4">
        <EmptyState
          icon={Bug}
          title="No issues found"
          description="Run a crawl to surface SEO issues."
          className="border-0 bg-transparent py-8"
        />
      </div>
    );
  }
  const top = [...issues]
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 5);
  return (
    <div>
      <ul className="divide-y divide-border/60">
        {top.map((i) => (
          <li key={i.id} className="flex items-start gap-3 px-4 py-3">
            <SeverityBadge severity={i.severity} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-mono text-xs font-medium">{i.type}</p>
              <p className="truncate text-xs text-muted-foreground" title={i.url}>
                {i.url}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="p-3">
        <Button variant="ghost" size="sm" className="w-full" onClick={onViewAll}>
          View all issues
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ---------------- AI recommendations card ---------------- */
function AIRecommendationsCard({
  siteId,
  hasAudit,
}: {
  siteId: string;
  hasAudit: boolean;
}) {
  const analyze = useAnalyzeAudit(siteId);
  const data = analyze.data?.analysis;

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Recommendations
            </CardTitle>
            <CardDescription>
              Prioritized, actionable fixes powered by AI analysis
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => analyze.mutate()}
            disabled={analyze.isPending || !hasAudit}
          >
            {analyze.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing…
              </>
            ) : data ? (
              <>
                <Wand2 className="h-4 w-4" />
                Re-analyze
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Get recommendations
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {analyze.isError ? (
          <p className="text-sm text-destructive">
            {(analyze.error as Error)?.message ||
              "AI analysis failed. Please try again."}
          </p>
        ) : analyze.isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : data ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <p className="text-sm leading-relaxed text-muted-foreground">
              {data.summary}
            </p>
            <div className="space-y-2.5">
              {data.recommendations.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3"
                >
                  <SeverityBadge
                    severity={priorityToSeverity(r.priority)}
                    className="mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="Let AI prioritize your fixes"
            description={
              hasAudit
                ? "Run AI analysis on your latest crawl to get a prioritized, plain-English action plan."
                : "Run a crawl first, then let AI turn the findings into a prioritized action plan."
            }
            className="border-0 bg-transparent"
          />
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Stat card ---------------- */
const toneMap: Record<string, { bg: string; fg: string }> = {
  red: { bg: "bg-red-500/12", fg: "text-red-500" },
  amber: { bg: "bg-amber-500/12", fg: "text-amber-500" },
  green: { bg: "bg-emerald-500/12", fg: "text-emerald-500" },
  blue: { bg: "bg-blue-500/12", fg: "text-blue-500" },
  sky: { bg: "bg-sky-500/12", fg: "text-sky-500" },
  muted: { bg: "bg-muted", fg: "text-muted-foreground" },
};

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "blue",
  loading,
  format,
}: {
  icon: typeof Globe;
  label: string;
  value: number;
  tone?: keyof typeof toneMap;
  loading?: boolean;
  format?: (n: number) => string;
}) {
  const t = toneMap[tone];
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.bg} ${t.fg}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 text-3xl font-bold tabular-nums">
          {loading ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <AnimatedCounter value={value} format={format} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
