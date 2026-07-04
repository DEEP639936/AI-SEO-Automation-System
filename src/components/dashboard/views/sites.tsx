"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useSites,
  useCreateSite,
  useDeleteSite,
  useCrawl,
  useLatestAudit,
  useAudits,
  type AuditIssue,
} from "@/hooks/use-api";
import { useUI } from "@/lib/store";
import { PageHeader } from "@/components/shared/page-header";
import { ScoreRing } from "@/components/shared/score-ring";
import { SeverityBadge, type Severity } from "@/components/shared/severity-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StaggerGroup, StaggerItem } from "@/components/shared/stagger";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Globe,
  Plus,
  Bug,
  Trash2,
  Loader2,
  RefreshCw,
  ArrowRight,
  Clock,
  Search,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SitesView() {
  const { selectedSiteId, setSelectedSiteId } = useUI();
  const sitesQ = useSites();
  const sites = sitesQ.data?.sites ?? [];

  return (
    <>
      <PageHeader
        title="Sites & Audits"
        description="Add websites, run crawls, and review SEO issues in detail."
        action={<AddSiteDialog />}
      />

      {sitesQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : sites.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No sites yet"
          description="Add your first website to start running automated SEO audits."
          action={<AddSiteDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((s) => {
            const score = s.audits?.[0]?.score;
            const active = selectedSiteId === s.id;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
                <Card
                  className={cn(
                    "h-full cursor-pointer transition-all hover:border-primary/40 hover:shadow-md",
                    active && "ring-2 ring-primary/50 border-primary/40"
                  )}
                  onClick={() => setSelectedSiteId(s.id)}
                >
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{s.name}</p>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                        >
                          <span className="truncate">{s.url}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold tabular-nums",
                          score == null
                            ? "bg-muted text-muted-foreground"
                            : score >= 80
                            ? "bg-emerald-500/12 text-emerald-500"
                            : score >= 50
                            ? "bg-amber-500/12 text-amber-500"
                            : "bg-red-500/12 text-red-500"
                        )}
                      >
                        {score ?? "—"}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Bug className="h-3 w-3" />
                        {s.audits?.length ? `${s.audits.length} audit${s.audits.length > 1 ? "s" : ""}` : "No audits"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {s.lastCrawlAt
                          ? new Date(s.lastCrawlAt).toLocaleDateString()
                          : "Never crawled"}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <SiteCrawlButton siteId={s.id} siteName={s.name} small />
                      <DeleteSiteButton siteId={s.id} siteName={s.name} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto"
                        onClick={() => setSelectedSiteId(s.id)}
                      >
                        Details
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* detail panel */}
      {selectedSiteId && (
        <div className="mt-8">
          <SiteAuditDetail siteId={selectedSiteId} />
        </div>
      )}
    </>
  );
}

/* ---------------- Add site dialog ---------------- */
function AddSiteDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [crawlFrequency, setCrawlFrequency] = useState("weekly");
  const create = useCreateSite();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url || !name) {
      toast.error("URL and site name are required");
      return;
    }
    try {
      await create.mutateAsync({
        url,
        name,
        sitemapUrl: sitemapUrl || undefined,
        crawlFrequency,
      });
      toast.success("Site added!");
      setUrl("");
      setName("");
      setSitemapUrl("");
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message || "Failed to add site");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add site
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a website</DialogTitle>
          <DialogDescription>
            Enter your site URL. We'll crawl it and report SEO issues.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="site-url">Site URL</Label>
            <Input
              id="site-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="site-name">Site name</Label>
            <Input
              id="site-name"
              placeholder="My Company"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sitemap">Sitemap URL (optional)</Label>
              <Input
                id="sitemap"
                placeholder="/sitemap.xml"
                value={sitemapUrl}
                onChange={(e) => setSitemapUrl(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="freq">Crawl frequency</Label>
              <Select value={crawlFrequency} onValueChange={setCrawlFrequency}>
                <SelectTrigger id="freq" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add site"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Crawl button ---------------- */
function SiteCrawlButton({
  siteId,
  siteName,
  small,
}: {
  siteId: string;
  siteName: string;
  small?: boolean;
}) {
  const crawl = useCrawl(siteId);
  return (
    <Button
      variant={small ? "outline" : "default"}
      size={small ? "sm" : "default"}
      disabled={crawl.isPending}
      onClick={async () => {
        try {
          await crawl.mutateAsync();
          toast.success(`Crawl complete for ${siteName}`);
        } catch (err) {
          toast.error((err as Error).message || "Crawl failed");
        }
      }}
    >
      {crawl.isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Crawling…
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          Crawl
        </>
      )}
    </Button>
  );
}

/* ---------------- Delete site ---------------- */
function DeleteSiteButton({ siteId, siteName }: { siteId: string; siteName: string }) {
  const del = useDeleteSite();
  const { selectedSiteId, setSelectedSiteId } = useUI();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {siteName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the site and all its audits, keywords, and
            reports. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={async () => {
              await del.mutateAsync(siteId);
              if (selectedSiteId === siteId) setSelectedSiteId(null);
              toast.success("Site deleted");
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------------- Selected site audit detail ---------------- */
function SiteAuditDetail({ siteId }: { siteId: string }) {
  const { data: sitesData } = useSites();
  const site = sitesData?.sites.find((s) => s.id === siteId);
  const auditQ = useLatestAudit(siteId);
  const auditsQ = useAudits(siteId);
  const [filter, setFilter] = useState<"all" | Severity>("all");

  const audit = auditQ.data?.audit ?? null;
  const issues = audit?.issues ?? [];
  const filtered =
    filter === "all" ? issues : issues.filter((i) => i.severity === filter);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              Audit detail — {site?.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {site?.url}
            </CardDescription>
          </div>
          <SiteCrawlButton siteId={siteId} siteName={site?.name ?? "site"} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {auditQ.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32 sm:col-span-2" />
          </div>
        ) : audit ? (
          <>
            {/* summary row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-muted/20 p-4">
                <ScoreRing score={audit.score} size={120} />
              </div>
              <div className="grid grid-cols-3 gap-3 sm:col-span-2">
                <CountTile label="Critical" value={audit.summary?.counts.critical ?? 0} tone="red" />
                <CountTile label="Warnings" value={audit.summary?.counts.warning ?? 0} tone="amber" />
                <CountTile label="Info" value={audit.summary?.counts.info ?? 0} tone="sky" />
                <CountTile label="Pages crawled" value={audit.pagesCrawled} tone="blue" />
                <CountTile label="Total issues" value={issues.length} tone="muted" />
                <CountTile
                  label="Crawl time"
                  value={Math.round(audit.durationMs / 1000)}
                  tone="muted"
                  suffix="s"
                />
              </div>
            </div>

            {/* issues table */}
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Issues ({filtered.length})</h3>
                <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="critical">Critical</TabsTrigger>
                    <TabsTrigger value="warning">Warning</TabsTrigger>
                    <TabsTrigger value="info">Info</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 py-10 text-center text-sm text-muted-foreground">
                  {issues.length === 0
                    ? "No issues detected — great job! 🎉"
                    : "No issues match this filter."}
                </div>
              ) : (
                <div className="max-h-[28rem] overflow-y-auto rounded-lg border border-border/60">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/60 backdrop-blur">
                      <TableRow>
                        <TableHead className="w-28">Severity</TableHead>
                        <TableHead className="w-44">Type</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((i) => (
                        <TableRow key={i.id}>
                          <TableCell>
                            <SeverityBadge severity={i.severity} />
                          </TableCell>
                          <TableCell className="font-mono text-xs font-medium">
                            {i.type}
                          </TableCell>
                          <TableCell className="max-w-[16rem]">
                            <span className="block truncate text-xs text-muted-foreground" title={i.url}>
                              {i.url}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[20rem]">
                            <span className="block truncate text-xs text-muted-foreground" title={i.detail}>
                              {i.detail}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* audit history */}
            {auditsQ.data && auditsQ.data.audits.length > 1 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold">Audit history</h3>
                <div className="space-y-2">
                  {auditsQ.data.audits.slice(0, 6).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(a.runAt).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {a.pagesCrawled} pages
                        </span>
                        <span
                          className={cn(
                            "font-bold tabular-nums",
                            a.score >= 80
                              ? "text-emerald-500"
                              : a.score >= 50
                              ? "text-amber-500"
                              : "text-red-500"
                          )}
                        >
                          {a.score}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={Bug}
            title="No audit yet"
            description="Run your first crawl to surface broken links, missing meta tags, and other SEO issues across this site."
            className="border-0 bg-transparent"
          />
        )}
      </CardContent>
    </Card>
  );
}

function CountTile({
  label,
  value,
  tone,
  suffix,
}: {
  label: string;
  value: number;
  tone: "red" | "amber" | "sky" | "blue" | "muted";
  suffix?: string;
}) {
  const map = {
    red: "text-red-500",
    amber: "text-amber-500",
    sky: "text-sky-500",
    blue: "text-blue-500",
    muted: "text-foreground",
  } as const;
  return (
    <div className="flex flex-col justify-center rounded-xl border border-border/60 bg-card p-3">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={cn("mt-1 text-2xl font-bold tabular-nums", map[tone])}>
        {value}
        {suffix}
      </span>
    </div>
  );
}
