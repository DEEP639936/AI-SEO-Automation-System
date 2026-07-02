"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api-client";

/* ===================== types ===================== */
export type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export type Site = {
  id: string;
  userId: string;
  url: string;
  name: string;
  sitemapUrl: string | null;
  crawlFrequency: string;
  lastCrawlAt: string | null;
  createdAt: string;
  updatedAt: string;
  audits?: { id: string; score: number; runAt: string }[];
  _count?: { keywords: number };
};

export type AuditIssue = {
  id: string;
  type: string;
  severity: "critical" | "warning" | "info";
  url: string;
  detail: string;
};

export type Audit = {
  id: string;
  siteId: string;
  runAt: string;
  score: number;
  pagesCrawled: number;
  durationMs: number;
  summaryJson: string;
  summary: {
    counts: { critical: number; warning: number; info: number };
    crawledAt: string;
    pages: {
      url: string;
      status: number;
      loadMs: number;
      title: string | null;
      https: boolean;
      h1Count: number;
    }[];
  } | null;
  issues?: AuditIssue[];
};

export type Keyword = {
  id: string;
  siteId: string;
  keyword: string;
  targetUrl: string | null;
  createdAt: string;
  rankings?: { id: string; position: number; checkedAt: string }[];
};

export type RankingChartItem = {
  id: string;
  keyword: string;
  targetUrl: string | null;
  latest: number | null;
  series: { date: string; position: number }[];
};

export type GeneratedContent = {
  titleTag: string;
  metaDescription: string;
  h1: string;
  body: string;
  keywordsSuggested: string[];
};

export type ImprovedContent = { improved: string; changes: string[] };

export type AuditAnalysis = {
  summary: string;
  recommendations: {
    priority: "high" | "medium" | "low";
    title: string;
    detail: string;
  }[];
};

export type ContentHistoryItem = {
  id: string;
  keyword: string;
  mode: string;
  prompt: string;
  output: string;
  createdAt: string;
  siteId: string | null;
};

export type Report = {
  id: string;
  siteId: string;
  periodStart: string;
  periodEnd: string;
  title: string;
  bodyHtml: string;
  bodyText: string;
  createdAt: string;
  sentAt: string | null;
  site?: { name: string; url: string };
};

/* ===================== auth ===================== */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<{ user: User } | null>("/api/auth/me"),
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      apiFetch<{ user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string; name?: string }) =>
      apiFetch<{ user: User }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ ok: true }>("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.setQueryData(["me"], null);
      qc.clear();
    },
  });
}

/* ===================== sites ===================== */
export function useSites() {
  return useQuery({
    queryKey: ["sites"],
    queryFn: () => apiFetch<{ sites: Site[] }>("/api/sites"),
    placeholderData: keepPreviousData,
  });
}

export function useCreateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      url: string;
      name: string;
      sitemapUrl?: string;
      crawlFrequency?: string;
    }) => apiFetch<{ site: Site }>("/api/sites", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sites"] }),
  });
}

export function useDeleteSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: true }>(`/api/sites/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sites"] }),
  });
}

export function useUpdateSite(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Site>) =>
      apiFetch<{ site: Site }>(`/api/sites/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sites"] }),
  });
}

/* ===================== crawl / audits ===================== */
export function useCrawl(siteId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ audit: Audit; pages: unknown[] }>(
        `/api/sites/${siteId}/crawl`,
        { method: "POST" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sites"] });
      qc.invalidateQueries({ queryKey: ["latest-audit", siteId] });
      qc.invalidateQueries({ queryKey: ["audits", siteId] });
    },
  });
}

export function useLatestAudit(siteId: string | null) {
  return useQuery({
    queryKey: ["latest-audit", siteId],
    queryFn: () =>
      apiFetch<{ audit: (Audit & { issues: AuditIssue[] }) | null }>(
        `/api/sites/${siteId}/audit/latest`
      ),
    enabled: !!siteId,
  });
}

export function useAudits(siteId: string | null) {
  return useQuery({
    queryKey: ["audits", siteId],
    queryFn: () =>
      apiFetch<{ audits: Audit[] }>(`/api/sites/${siteId}/audits`),
    enabled: !!siteId,
  });
}

export function useAnalyzeAudit(siteId: string | null) {
  return useMutation({
    mutationFn: () =>
      apiFetch<{ analysis: AuditAnalysis; auditId: string }>(
        `/api/sites/${siteId}/analyze`,
        { method: "POST" }
      ),
  });
}

/* ===================== content (AI) ===================== */
export function useGenerateContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      keyword: string;
      context?: string;
      tone?: string;
      siteId?: string | null;
    }) =>
      apiFetch<{ content: GeneratedContent; id: string }>(
        "/api/content/generate",
        { method: "POST", body: JSON.stringify(body) }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content-history"] }),
  });
}

export function useImproveContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      content: string;
      keyword: string;
      siteId?: string | null;
    }) =>
      apiFetch<{ result: ImprovedContent; id: string }>(
        "/api/content/improve",
        { method: "POST", body: JSON.stringify(body) }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content-history"] }),
  });
}

export function useContentHistory() {
  return useQuery({
    queryKey: ["content-history"],
    queryFn: () =>
      apiFetch<{ items: ContentHistoryItem[] }>("/api/content/history"),
  });
}

/* ===================== keywords / rankings ===================== */
export function useKeywords(siteId: string | null) {
  return useQuery({
    queryKey: ["keywords", siteId],
    queryFn: () =>
      apiFetch<{ keywords: Keyword[] }>(`/api/sites/${siteId}/keywords`),
    enabled: !!siteId,
  });
}

export function useAddKeyword(siteId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { keyword: string; targetUrl?: string | null }) =>
      apiFetch<{ keyword: Keyword }>(`/api/sites/${siteId}/keywords`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["keywords", siteId] });
      qc.invalidateQueries({ queryKey: ["rankings", siteId] });
    },
  });
}

export function useDeleteKeyword(siteId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: true }>(`/api/keywords/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["keywords", siteId] });
      qc.invalidateQueries({ queryKey: ["rankings", siteId] });
    },
  });
}

export function useCheckRanking(siteId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keywordId: string) =>
      apiFetch<{ ranking: { id: string; position: number }; source: string }>(
        `/api/keywords/${keywordId}/check`,
        { method: "POST" }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["keywords", siteId] });
      qc.invalidateQueries({ queryKey: ["rankings", siteId] });
    },
  });
}

export function useRankings(siteId: string | null) {
  return useQuery({
    queryKey: ["rankings", siteId],
    queryFn: () =>
      apiFetch<{ siteUrl: string; keywords: RankingChartItem[] }>(
        `/api/sites/${siteId}/rankings`
      ),
    enabled: !!siteId,
  });
}

/* ===================== reports ===================== */
export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: () => apiFetch<{ reports: Report[] }>("/api/reports"),
  });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (siteId: string) =>
      apiFetch<{ report: Report }>("/api/reports", {
        method: "POST",
        body: JSON.stringify({ siteId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useReport(id: string | null) {
  return useQuery({
    queryKey: ["report", id],
    queryFn: () => apiFetch<{ report: Report }>(`/api/reports/${id}`),
    enabled: !!id,
  });
}

export { ApiError };
