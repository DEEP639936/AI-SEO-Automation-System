"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  useKeywords,
  useAddKeyword,
  useDeleteKeyword,
  useCheckRanking,
  useRankings,
} from "@/hooks/use-api";
import { useUI } from "@/lib/store";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  TrendingUp,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  Globe,
  ArrowDown,
  ArrowUp,
  Minus,
  Target,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#ef4444", "#84cc16"];

export function KeywordsView() {
  const { selectedSiteId, setView } = useUI();
  const kwQ = useKeywords(selectedSiteId);
  const rankingsQ = useRankings(selectedSiteId);
  const [keyword, setKeyword] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const add = useAddKeyword(selectedSiteId);
  const checkAll = useCheckRanking(selectedSiteId);

  if (!selectedSiteId) {
    return (
      <>
        <PageHeader title="Keywords" description="Track keyword rankings over time." />
        <EmptyState
          icon={Globe}
          title="Select a site first"
          description="Choose a site from the sidebar to manage its target keywords and ranking trends."
          action={
            <Button onClick={() => setView("sites")}>
              Go to sites
            </Button>
          }
        />
      </>
    );
  }

  const keywords = rankingsQ.data?.keywords ?? [];

  // merge chart data: one row per date with each keyword's position
  const dates = new Set<string>();
  for (const k of keywords) for (const p of k.series) dates.add(p.date);
  const sortedDates = [...dates].sort();
  const chartData = sortedDates.map((d) => {
    const row: Record<string, string | number> = { date: d.slice(5) };
    for (const k of keywords) {
      const pt = k.series.find((p) => p.date === d);
      row[k.keyword] = pt ? pt.position : null;
    }
    return row;
  });

  async function checkAllRankings() {
    if (!kwQ.data) return;
    try {
      for (const k of kwQ.data.keywords) {
        await checkAll.mutateAsync(k.id);
      }
      toast.success(`Checked ${kwQ.data.keywords.length} keywords`);
    } catch (err) {
      toast.error((err as Error).message || "Check failed");
    }
  }

  return (
    <>
      <PageHeader
        title="Keywords"
        description="Track ranking positions over time and spot trends."
        action={
          <Button
            variant="outline"
            onClick={checkAllRankings}
            disabled={checkAll.isPending || !kwQ.data?.keywords.length}
          >
            {checkAll.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Check all
          </Button>
        }
      />

      {/* add keyword */}
      <Card className="mb-5">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="kw">Add keyword</Label>
            <Input
              id="kw"
              placeholder="best project management tool"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kw-url">Target URL (optional)</Label>
            <Input
              id="kw-url"
              placeholder="/features"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="h-10"
            />
          </div>
          <Button
            disabled={add.isPending || !keyword.trim()}
            onClick={async () => {
              try {
                await add.mutateAsync({
                  keyword,
                  targetUrl: targetUrl || null,
                });
                setKeyword("");
                setTargetUrl("");
                toast.success("Keyword added with 14 days of history");
              } catch (err) {
                toast.error((err as Error).message || "Failed to add keyword");
              }
            }}
          >
            {add.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add
          </Button>
        </CardContent>
      </Card>

      {/* simulated notice */}
      <div className="mb-5 flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/8 px-3 py-2 text-xs text-sky-600 dark:text-sky-400">
        <Info className="h-3.5 w-3.5 shrink-0" />
        Rankings run on a deterministic simulation. Connect Google Search
        Console or SEMrush via <code className="rounded bg-muted px-1">GSC_SERVICE_ACCOUNT_JSON</code> /
        <code className="rounded bg-muted px-1">SEMRUSH_API_KEY</code> for live data.
      </div>

      {/* trend chart */}
      <Card className="mb-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Ranking trends
          </CardTitle>
          <CardDescription>
            Position over time (lower = better). Up is better on this chart.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rankingsQ.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : keywords.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No keywords tracked yet"
              description="Add your first target keyword above to start tracking its position."
              className="h-72 border-0 bg-transparent"
            />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 6, right: 8, bottom: 0, left: -16 }}>
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
                    formatter={(v: number, name: string) => [
                      v == null ? "—" : `#${v}`,
                      name,
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {keywords.map((k, i) => (
                    <Line
                      key={k.id}
                      type="monotone"
                      dataKey={k.keyword}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tracked keywords</CardTitle>
          <CardDescription>
            {kwQ.data?.keywords.length ?? 0} keywords
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {kwQ.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !kwQ.data?.keywords.length ? (
            <div className="p-4">
              <EmptyState
                icon={Target}
                title="No keywords yet"
                description="Add keywords above to track their rankings."
                className="border-0 bg-transparent"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead className="w-28">Latest</TableHead>
                    <TableHead className="w-28">Change</TableHead>
                    <TableHead className="w-32">Sparkline</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.map((k) => {
                    const latest = k.series.length ? k.series[k.series.length - 1].position : null;
                    const prev = k.series.length > 1 ? k.series[k.series.length - 2].position : null;
                    const delta =
                      latest != null && prev != null ? prev - latest : 0; // positive = improved
                    return (
                      <KeywordRow
                        key={k.id}
                        id={k.id}
                        keyword={k.keyword}
                        targetUrl={k.targetUrl}
                        latest={latest}
                        delta={delta}
                        series={k.series}
                        onCheck={async () => {
                          try {
                            await checkAll.mutateAsync(k.id);
                            toast.success(`Checked "${k.keyword}"`);
                          } catch (err) {
                            toast.error((err as Error).message);
                          }
                        }}
                        checking={checkAll.isPending}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function KeywordRow({
  id,
  keyword,
  targetUrl,
  latest,
  delta,
  series,
  onCheck,
  checking,
}: {
  id: string;
  keyword: string;
  targetUrl: string | null;
  latest: number | null;
  delta: number;
  series: { date: string; position: number }[];
  onCheck: () => void;
  checking: boolean;
}) {
  const del = useDeleteKeyword(useUI.getState().selectedSiteId);
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{keyword}</div>
        {targetUrl && (
          <div className="text-xs text-muted-foreground">{targetUrl}</div>
        )}
      </TableCell>
      <TableCell>
        {latest == null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span
            className={cn(
              "font-bold tabular-nums",
              latest <= 10
                ? "text-emerald-500"
                : latest <= 30
                ? "text-amber-500"
                : "text-red-500"
            )}
          >
            #{latest}
          </span>
        )}
      </TableCell>
      <TableCell>
        {delta === 0 ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Minus className="h-3 w-3" /> —
          </span>
        ) : delta > 0 ? (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
            <ArrowUp className="h-3 w-3" /> +{delta}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-red-500">
            <ArrowDown className="h-3 w-3" /> {delta}
          </span>
        )}
      </TableCell>
      <TableCell>
        <Sparkline data={series} />
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCheck}
            disabled={checking}
            aria-label={`Check ${keyword}`}
          >
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove "{keyword}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This deletes the keyword and all its ranking history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    await del.mutateAsync(id);
                    toast.success(`Removed "${keyword}"`);
                  }}
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

function Sparkline({ data }: { data: { date: string; position: number }[] }) {
  if (!data.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map((d) => ({ date: d.date, position: d.position }))}>
          <Line
            type="monotone"
            dataKey="position"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} reversed />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
