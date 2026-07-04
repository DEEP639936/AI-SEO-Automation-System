"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useReports, useGenerateReport, useSites, type Report } from "@/hooks/use-api";
import { useUI } from "@/lib/store";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Loader2,
  Mail,
  Calendar,
  Sparkles,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

export function ReportsView() {
  const reportsQ = useReports();
  const sitesQ = useSites();
  const { selectedSiteId } = useUI();
  const generate = useGenerateReport();
  const [viewing, setViewing] = useState<Report | null>(null);
  const [siteForReport, setSiteForReport] = useState<string>(selectedSiteId ?? "");

  const reports = reportsQ.data?.reports ?? [];
  const sites = sitesQ.data?.sites ?? [];

  function download(r: Report) {
    const blob = new Blob([r.bodyHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Generate and review automated SEO reports for your sites."
        action={
          <div className="flex items-center gap-2">
            <Select
              value={siteForReport}
              onValueChange={setSiteForReport}
            >
              <SelectTrigger className="h-10 w-44">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={generate.isPending || !siteForReport}
              onClick={async () => {
                try {
                  const res = await generate.mutateAsync(siteForReport);
                  toast.success("Report generated");
                  setViewing(res.report);
                } catch (err) {
                  toast.error((err as Error).message || "Failed to generate");
                }
              }}
            >
              {generate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate
            </Button>
          </div>
        }
      />

      {/* email note — demo mode */}
      <div className="mb-5 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
        <Mail className="h-3.5 w-3.5 shrink-0" />
        <span>
          <strong className="font-semibold">Demo mode:</strong> Resend is
          connected in demo mode — reports are generated and stored in-app for
          viewing and download. Add a real{" "}
          <code className="rounded bg-muted px-1">RESEND_API_KEY</code> in{" "}
          <code className="rounded bg-muted px-1">.env</code> to enable email
          delivery.
        </span>
      </div>

      {reportsQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Generate your first SEO report. It bundles your latest audit, keyword trends, and top issues into a shareable summary."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="group h-full transition-all hover:border-primary/40 hover:shadow-md">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    {r.sentAt ? (
                      <Badge variant="secondary" className="gap-1">
                        <Mail className="h-3 w-3" /> Sent
                      </Badge>
                    ) : (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </div>
                  <p className="line-clamp-2 font-semibold leading-snug">
                    {r.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Globe className="h-3 w-3" />
                    {r.site?.name ?? "Site"}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(r.periodStart).toLocaleDateString()} →{" "}
                    {new Date(r.periodEnd).toLocaleDateString()}
                  </p>
                  <div className="mt-4 flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setViewing(r)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => download(r)}
                      aria-label="Download report"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* viewer */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[88vh] w-[min(820px,95vw)] max-w-[95vw] overflow-hidden p-0">
          <DialogHeader className="border-b border-border/60 px-5 py-3">
            <DialogTitle className="text-base">{viewing?.title}</DialogTitle>
            <DialogDescription className="sr-only">Report preview</DialogDescription>
          </DialogHeader>
          <div className="h-[70vh] w-full overflow-hidden bg-muted/30">
            {viewing && (
              <iframe
                title="report"
                srcDoc={viewing.bodyHtml}
                className="h-full w-full border-0 bg-white"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
