import { load } from "cheerio";

/**
 * SEO web crawler — pure TypeScript, server-runtime only.
 *
 * Uses Node's global `fetch` + `cheerio` for HTML parsing. No browser
 * automation (no Playwright/Puppeteer). Respects robots.txt for the
 * wildcard user-agent. Designed to be called from Next.js route handlers.
 */

export type IssueSeverity = "critical" | "warning" | "info";

export interface CrawlIssue {
  type: string;
  severity: IssueSeverity;
  url: string;
  detail: string;
}

export interface CrawlPageResult {
  url: string;
  status: number;
  loadMs: number;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  https: boolean;
  issues: CrawlIssue[];
}

export interface CrawlResult {
  pages: CrawlPageResult[];
  issues: CrawlIssue[];
  score: number;
  crawledAt: string;
  durationMs: number;
}

const USER_AGENT = "Mozilla/5.0 (compatible; SEOScoutBot/1.0)";
const DEFAULT_MAX_PAGES = 8;
const DEFAULT_TIMEOUT_MS = 8000;
const SLOW_LOAD_THRESHOLD_MS = 3000;
const MAX_QUEUE_SIZE = 500;

/* ---------- URL helpers ---------- */

function normalizeRootUrl(raw: string): URL {
  const candidate = raw?.trim();
  if (!candidate) {
    throw new Error(`Invalid URL: empty input`);
  }
  let withProto = candidate;
  if (!/^https?:\/\//i.test(withProto)) {
    // Tolerate inputs like "example.com" — assume https
    withProto = "https://" + withProto;
  }
  let url: URL;
  try {
    url = new URL(withProto);
  } catch {
    throw new Error(`Invalid URL: ${raw}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Invalid URL: unsupported protocol ${url.protocol}`);
  }
  // Drop fragment / hash on the root URL itself
  url.hash = "";
  return url;
}

/**
 * Returns true if `url`'s path matches any of the given robots.txt
 * `Disallow` rules (interpreted as path prefixes, with `/` meaning
 * "block everything except explicit Allow rules").
 */
export function isProbablyDisallowed(
  url: string,
  disallowed: string[]
): boolean {
  if (!disallowed || disallowed.length === 0) return false;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  const path = u.pathname + u.search;
  for (const rule of disallowed) {
    if (!rule) continue; // empty Disallow means allow everything
    if (rule === "/") return true;
    if (path === rule) return true;
    if (path.startsWith(rule)) {
      // Treat as a prefix match — a trailing "/" or boundary char makes the
      // disallow unambiguous. For rules like "/private" we also block
      // "/private.html" to be conservative (matches Google's behavior).
      return true;
    }
  }
  return false;
}

/* ---------- robots.txt ---------- */

async function fetchRobotsDisallowed(origin: string): Promise<string[]> {
  const rules: string[] = [];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return rules;
    const text = await res.text();
    const lines = text.split(/\r?\n/);

    // Track whether we are inside a `User-agent: *` group.
    // A new `User-agent:` line always starts a new group.
    let activeForStar = false;
    for (const rawLine of lines) {
      // Strip comments + trim
      const line = rawLine.split("#")[0].trim();
      if (!line) continue;
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const field = line.slice(0, colonIdx).trim().toLowerCase();
      const value = line.slice(colonIdx + 1).trim();
      if (field === "user-agent") {
        activeForStar = value === "*";
        continue;
      }
      if (field === "disallow" && activeForStar) {
        // Even an empty value is meaningful (allow all) — we skip empties
        // in isProbablyDisallowed, so just collect non-empty ones here.
        if (value) rules.push(value);
      }
      // We intentionally ignore `Allow:` directives for simplicity — they
      // are rare in practice and our prefix-based matcher errs safe.
    }
  } catch {
    // robots.txt unreachable → assume allowed
  }
  return rules;
}

/* ---------- fetch with timeout ---------- */

async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<{ response: Response; loadMs: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    return { response, loadMs: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- link resolution ---------- */

function resolveSameOriginLink(href: string, baseUrl: URL): URL | null {
  if (!href) return null;
  const lower = href.trim().toLowerCase();
  if (
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:") ||
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("#")
  ) {
    return null;
  }
  let resolved: URL;
  try {
    resolved = new URL(href, baseUrl);
  } catch {
    return null;
  }
  if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
    return null;
  }
  if (resolved.host !== baseUrl.host) return null;
  resolved.hash = ""; // strip fragment
  return resolved;
}

/* ---------- main entry ---------- */

export async function crawlSite(
  rootUrl: string,
  opts?: { maxPages?: number; timeoutMs?: number }
): Promise<CrawlResult> {
  const startedAt = Date.now();
  const root = normalizeRootUrl(rootUrl);
  const rootOrigin = `${root.protocol}//${root.host}`;
  const maxPages = Math.max(1, opts?.maxPages ?? DEFAULT_MAX_PAGES);
  const timeoutMs = Math.max(500, opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  const disallowed = await fetchRobotsDisallowed(rootOrigin);

  const pages: CrawlPageResult[] = [];
  const aggregated: CrawlIssue[] = [];

  const processed = new Set<string>();
  const inQueue = new Set<string>();
  const queue: string[] = [];

  const enqueue = (url: string) => {
    if (processed.has(url) || inQueue.has(url)) return;
    if (queue.length >= MAX_QUEUE_SIZE) return;
    inQueue.add(url);
    queue.push(url);
  };

  enqueue(root.href);

  const titleTracker = new Map<string, string[]>(); // normalized title -> urls

  while (queue.length > 0 && pages.length < maxPages) {
    const currentHref = queue.shift() as string;
    inQueue.delete(currentHref);
    if (processed.has(currentHref)) continue;
    processed.add(currentHref);

    if (isProbablyDisallowed(currentHref, disallowed)) {
      aggregated.push({
        type: "robots_disallowed",
        severity: "info",
        url: currentHref,
        detail: "URL skipped — disallowed by robots.txt",
      });
      continue;
    }

    const pageResult: CrawlPageResult = {
      url: currentHref,
      status: 0,
      loadMs: 0,
      title: null,
      metaDescription: null,
      h1Count: 0,
      https: currentHref.startsWith("https://"),
      issues: [],
    };

    try {
      /* ---- 1. fetch (with timeout) ---- */
      let response: Response;
      let loadMs = 0;
      try {
        const fetched = await fetchWithTimeout(currentHref, timeoutMs);
        response = fetched.response;
        loadMs = fetched.loadMs;
      } catch (err: unknown) {
        const detail =
          err instanceof Error
            ? err.name === "AbortError"
              ? "timeout"
              : err.message
            : "network error";
        pageResult.loadMs = timeoutMs;
        const issue: CrawlIssue = {
          type: "broken_link",
          severity: "warning",
          url: currentHref,
          detail,
        };
        pageResult.issues.push(issue);
        aggregated.push(issue);
        pages.push(pageResult);
        continue;
      }

      pageResult.status = response.status;
      pageResult.loadMs = loadMs;

      /* ---- 2. slow load check ---- */
      if (loadMs > SLOW_LOAD_THRESHOLD_MS) {
        const issue: CrawlIssue = {
          type: "slow_load",
          severity: "warning",
          url: currentHref,
          detail: `${loadMs}ms`,
        };
        pageResult.issues.push(issue);
        aggregated.push(issue);
      }

      /* ---- 3. non-HTTPS check (only meaningful for http pages) ---- */
      if (!pageResult.https) {
        const issue: CrawlIssue = {
          type: "non_https",
          severity: "critical",
          url: currentHref,
          detail: "Page is served over HTTP, not HTTPS",
        };
        pageResult.issues.push(issue);
        aggregated.push(issue);
      }

      /* ---- 4. non-2xx → broken link, skip parsing ---- */
      if (response.status < 200 || response.status >= 300) {
        const issue: CrawlIssue = {
          type: "broken_link",
          severity:
            response.status >= 400 && response.status < 600
              ? "critical"
              : "warning",
          url: currentHref,
          detail: `${response.status}`,
        };
        pageResult.issues.push(issue);
        aggregated.push(issue);
        pages.push(pageResult);
        continue;
      }

      /* ---- 5. non-HTML content → skip parsing ---- */
      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      if (
        !contentType.includes("text/html") &&
        !contentType.includes("application/xhtml")
      ) {
        pages.push(pageResult);
        continue;
      }

      /* ---- 6. parse HTML ---- */
      const html = await response.text();
      const $ = load(html);

      const title = $("title").first().text().trim() || null;
      const metaDescription =
        $('meta[name="description"]').attr("content")?.trim() || null;
      const h1Count = $("h1").length;
      const hasViewport = $('meta[name="viewport"]').attr("content") != null;

      pageResult.title = title;
      pageResult.metaDescription = metaDescription;
      pageResult.h1Count = h1Count;

      if (!title) {
        const issue: CrawlIssue = {
          type: "missing_title",
          severity: "critical",
          url: currentHref,
          detail: "Page has no <title> element",
        };
        pageResult.issues.push(issue);
        aggregated.push(issue);
      }
      if (!metaDescription) {
        const issue: CrawlIssue = {
          type: "missing_meta_description",
          severity: "warning",
          url: currentHref,
          detail: "Page has no meta description",
        };
        pageResult.issues.push(issue);
        aggregated.push(issue);
      }
      if (h1Count === 0) {
        const issue: CrawlIssue = {
          type: "missing_h1",
          severity: "warning",
          url: currentHref,
          detail: "Page has no <h1> element",
        };
        pageResult.issues.push(issue);
        aggregated.push(issue);
      } else if (h1Count > 1) {
        const issue: CrawlIssue = {
          type: "multiple_h1",
          severity: "info",
          url: currentHref,
          detail: `Page has ${h1Count} <h1> elements`,
        };
        pageResult.issues.push(issue);
        aggregated.push(issue);
      }
      if (!hasViewport) {
        const issue: CrawlIssue = {
          type: "missing_mobile_viewport",
          severity: "warning",
          url: currentHref,
          detail: "Page is missing a <meta name=\"viewport\"> tag",
        };
        pageResult.issues.push(issue);
        aggregated.push(issue);
      }

      /* ---- 7. images without alt ---- */
      $("img").each((_, el) => {
        const $el = $(el);
        const alt = $el.attr("alt");
        if (alt === undefined || alt === null || alt.trim() === "") {
          const src = $el.attr("src") || "(no src)";
          const issue: CrawlIssue = {
            type: "missing_alt",
            severity: "warning",
            url: currentHref,
            detail: src,
          };
          pageResult.issues.push(issue);
          aggregated.push(issue);
        }
      });

      /* ---- 8. title duplicate tracking ---- */
      if (title) {
        const list = titleTracker.get(title);
        if (list) list.push(currentHref);
        else titleTracker.set(title, [currentHref]);
      }

      /* ---- 9. discover same-origin links for further crawling ---- */
      const baseUrl = new URL(currentHref);
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        const resolved = resolveSameOriginLink(href, baseUrl);
        if (!resolved) return;
        if (isProbablyDisallowed(resolved.href, disallowed)) return;
        enqueue(resolved.href);
      });
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : "unknown error";
      const issue: CrawlIssue = {
        type: "broken_link",
        severity: "warning",
        url: currentHref,
        detail,
      };
      pageResult.issues.push(issue);
      aggregated.push(issue);
    }

    pages.push(pageResult);
  }

  /* ---- duplicate titles across pages ---- */
  for (const [title, urls] of titleTracker.entries()) {
    if (urls.length > 1) {
      aggregated.push({
        type: "duplicate_title",
        severity: "info",
        url: urls[0],
        detail: `Title "${title}" appears on ${urls.length} pages: ${urls.join(", ")}`,
      });
    }
  }

  /* ---- health score ---- */
  let criticalCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  for (const i of aggregated) {
    if (i.severity === "critical") criticalCount++;
    else if (i.severity === "warning") warningCount++;
    else infoCount++;
  }
  let score = 100 - criticalCount * 12 - warningCount * 5 - infoCount * 1;
  score = Math.max(0, Math.min(100, score));

  return {
    pages,
    issues: aggregated,
    score: Math.round(score),
    crawledAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
  };
}
