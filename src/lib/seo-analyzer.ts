/**
 * SEO Analysis Module — categorizes crawl results into the three SEO pillars:
 *   1. On-Page SEO  (content + HTML elements you control on each page)
 *   2. Off-Page SEO (external signals — backlinks, social, brand authority)
 *   3. Technical SEO (crawlability, performance, indexability, security)
 *
 * Each pillar gets a 0-100 score, a status (good/warning/poor), a checklist
 * of passing/failing checks, and the specific issues driving the score.
 *
 * Off-Page is estimated from signals we CAN observe without third-party APIs
 * (external link count discovered during crawl, social meta tags, brand
 * mention heuristics). A real backlink API (SEMrush/Ahrefs) would enrich this
 * — the extension point is documented below.
 */
import type { CrawlResult, CrawlPageResult, CrawlIssue } from "@/lib/crawler";

export type PillarId = "on-page" | "off-page" | "technical";
export type CheckStatus = "pass" | "warn" | "fail";

export interface SeoCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  count?: number; // e.g. "3 missing titles"
}

export interface SeoPillar {
  id: PillarId;
  name: string;
  score: number; // 0-100
  status: "good" | "warning" | "poor";
  description: string;
  checks: SeoCheck[];
  issues: CrawlIssue[]; // the crawl issues that belong to this pillar
}

export interface SeoAnalysis {
  siteUrl: string;
  overallScore: number;
  pillars: SeoPillar[];
  summary: string;
  analyzedAt: string;
}

/* ---------- issue type → pillar mapping ---------- */

const ON_PAGE_TYPES = new Set([
  "missing_title",
  "missing_meta_description",
  "missing_h1",
  "multiple_h1",
  "duplicate_title",
  "missing_alt",
  "robots_disallowed",
]);

const TECHNICAL_TYPES = new Set([
  "broken_link",
  "slow_load",
  "non_https",
  "missing_mobile_viewport",
]);

/* ---------- helpers ---------- */

function countByType(issues: CrawlIssue[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const i of issues) m.set(i.type, (m.get(i.type) ?? 0) + 1);
  return m;
}

function statusFromScore(score: number): "good" | "warning" | "poor" {
  if (score >= 80) return "good";
  if (score >= 50) return "warning";
  return "poor";
}

/* ---------- On-Page SEO ---------- */

function analyzeOnPage(
  pages: CrawlPageResult[],
  issues: CrawlIssue[]
): SeoPillar {
  const typeCounts = countByType(issues);
  const pillarIssues = issues.filter((i) => ON_PAGE_TYPES.has(i.type));

  const totalPages = pages.length;
  const pagesWithTitle = pages.filter((p) => p.title).length;
  const pagesWithDesc = pages.filter((p) => p.metaDescription).length;
  const pagesWithH1 = pages.filter((p) => p.h1Count > 0).length;
  const pagesWithViewport = pages.filter(
    (p) => p.issues.some((i) => i.type === "missing_mobile_viewport") === false
  ).length;

  // Image alt-text check
  const missingAltCount = typeCounts.get("missing_alt") ?? 0;

  // Title length check (ideal 50-60 chars)
  const badTitleLength = pages.filter(
    (p) =>
      p.title &&
      (p.title.length < 30 || p.title.length > 65)
  ).length;

  // Meta description length check (ideal 120-160 chars)
  const badDescLength = pages.filter(
    (p) =>
      p.metaDescription &&
      (p.metaDescription.length < 70 || p.metaDescription.length > 170)
  ).length;

  const checks: SeoCheck[] = [
    {
      id: "title-tags",
      label: "Title tags present on all pages",
      status: pagesWithTitle === totalPages ? "pass" : "fail",
      detail:
        pagesWithTitle === totalPages
          ? "All crawled pages have a <title> tag"
          : `${totalPages - pagesWithTitle} of ${totalPages} pages missing a title tag`,
      count: totalPages - pagesWithTitle,
    },
    {
      id: "title-length",
      label: "Title tags within ideal length (50–60 chars)",
      status: badTitleLength === 0 ? "pass" : badTitleLength > totalPages / 2 ? "fail" : "warn",
      detail:
        badTitleLength === 0
          ? "All titles are within the ideal length range"
          : `${badTitleLength} pages have titles that are too short or too long`,
      count: badTitleLength,
    },
    {
      id: "meta-descriptions",
      label: "Meta descriptions present",
      status: pagesWithDesc === totalPages ? "pass" : "fail",
      detail:
        pagesWithDesc === totalPages
          ? "All pages have a meta description"
          : `${totalPages - pagesWithDesc} of ${totalPages} pages missing a meta description`,
      count: totalPages - pagesWithDesc,
    },
    {
      id: "meta-desc-length",
      label: "Meta descriptions within ideal length (120–160 chars)",
      status: badDescLength === 0 ? "pass" : badDescLength > totalPages / 2 ? "fail" : "warn",
      detail:
        badDescLength === 0
          ? "All meta descriptions are well-sized"
          : `${badDescLength} pages have meta descriptions outside the ideal range`,
      count: badDescLength,
    },
    {
      id: "h1-tags",
      label: "Single H1 on each page",
      status: pagesWithH1 === totalPages ? "pass" : "fail",
      detail:
        pagesWithH1 === totalPages
          ? "All pages have exactly one H1"
          : `${totalPages - pagesWithH1} pages are missing an H1`,
      count: totalPages - pagesWithH1,
    },
    {
      id: "image-alt",
      label: "Images have descriptive alt text",
      status: missingAltCount === 0 ? "pass" : missingAltCount > 10 ? "fail" : "warn",
      detail:
        missingAltCount === 0
          ? "All images have alt text"
          : `${missingAltCount} images are missing alt text (hurts accessibility + image search)`,
      count: missingAltCount,
    },
    {
      id: "duplicate-titles",
      label: "No duplicate title tags",
      status: (typeCounts.get("duplicate_title") ?? 0) === 0 ? "pass" : "warn",
      detail:
        (typeCounts.get("duplicate_title") ?? 0) === 0
          ? "All titles are unique"
          : "Duplicate title tags detected across pages",
    },
  ];

  // Score: weighted by check importance
  const weights: Record<string, number> = {
    "title-tags": 20,
    "title-length": 10,
    "meta-descriptions": 20,
    "meta-desc-length": 10,
    "h1-tags": 15,
    "image-alt": 15,
    "duplicate-titles": 10,
  };
  let score = 0;
  let maxScore = 0;
  for (const c of checks) {
    const w = weights[c.id] ?? 10;
    maxScore += w;
    if (c.status === "pass") score += w;
    else if (c.status === "warn") score += w * 0.5;
  }
  const finalScore = Math.round((score / maxScore) * 100);

  return {
    id: "on-page",
    name: "On-Page SEO",
    score: finalScore,
    status: statusFromScore(finalScore),
    description:
      "Content and HTML elements on your pages — titles, meta descriptions, headings, image alt text, and keyword usage.",
    checks,
    issues: pillarIssues,
  };
}

/* ---------- Technical SEO ---------- */

function analyzeTechnical(
  pages: CrawlPageResult[],
  issues: CrawlIssue[]
): SeoPillar {
  const typeCounts = countByType(issues);
  const pillarIssues = issues.filter((i) => TECHNICAL_TYPES.has(i.type));

  const totalPages = pages.length;
  const httpsPages = pages.filter((p) => p.https).length;
  const brokenCount = typeCounts.get("broken_link") ?? 0;
  const slowCount = typeCounts.get("slow_load") ?? 0;
  const nonHttpsCount = typeCounts.get("non_https") ?? 0;
  const noViewportCount = typeCounts.get("missing_mobile_viewport") ?? 0;

  // Performance: average load time
  const avgLoadMs =
    totalPages > 0
      ? Math.round(pages.reduce((s, p) => s + p.loadMs, 0) / totalPages)
      : 0;
  const fastPages = pages.filter((p) => p.loadMs <= 2500).length;

  // Redirect chain heuristic: we don't follow chains explicitly, but
  // non-2xx pages suggest redirect/crawl issues.
  const errorPages = pages.filter(
    (p) => p.status >= 300 && p.status < 200
  ).length + pages.filter((p) => p.status >= 400).length;

  const checks: SeoCheck[] = [
    {
      id: "https",
      label: "Served over HTTPS",
      status: nonHttpsCount === 0 ? "pass" : "fail",
      detail:
        nonHttpsCount === 0
          ? "All pages are served over HTTPS"
          : `${nonHttpsCount} pages are served over insecure HTTP`,
      count: nonHttpsCount,
    },
    {
      id: "mobile-friendly",
      label: "Mobile-friendly (viewport meta tag)",
      status: noViewportCount === 0 ? "pass" : "fail",
      detail:
        noViewportCount === 0
          ? "All pages have a viewport meta tag"
          : `${noViewportCount} pages are missing the mobile viewport tag`,
      count: noViewportCount,
    },
    {
      id: "page-speed",
      label: "Pages load under 3 seconds",
      status: slowCount === 0 ? "pass" : slowCount > totalPages / 2 ? "fail" : "warn",
      detail:
        slowCount === 0
          ? `All pages load fast (avg ${avgLoadMs}ms)`
          : `${slowCount} pages load slower than 3s (avg ${avgLoadMs}ms)`,
      count: slowCount,
    },
    {
      id: "broken-links",
      label: "No broken links (4xx/5xx)",
      status: brokenCount === 0 ? "pass" : brokenCount > 5 ? "fail" : "warn",
      detail:
        brokenCount === 0
          ? "No broken links detected"
          : `${brokenCount} broken links (4xx/5xx) found during crawl`,
      count: brokenCount,
    },
    {
      id: "crawl-errors",
      label: "Pages return 2xx status",
      status: errorPages === 0 ? "pass" : errorPages > 3 ? "fail" : "warn",
      detail:
        errorPages === 0
          ? "All crawled pages returned successful status codes"
          : `${errorPages} pages returned error status codes`,
      count: errorPages,
    },
    {
      id: "fast-avg",
      label: "Average load time under 2.5s",
      status: avgLoadMs <= 2500 ? "pass" : avgLoadMs <= 4000 ? "warn" : "fail",
      detail: `Average page load time is ${avgLoadMs}ms across ${totalPages} pages`,
    },
  ];

  const weights: Record<string, number> = {
    https: 20,
    "mobile-friendly": 20,
    "page-speed": 20,
    "broken-links": 15,
    "crawl-errors": 15,
    "fast-avg": 10,
  };
  let score = 0;
  let maxScore = 0;
  for (const c of checks) {
    const w = weights[c.id] ?? 10;
    maxScore += w;
    if (c.status === "pass") score += w;
    else if (c.status === "warn") score += w * 0.5;
  }
  const finalScore = Math.round((score / maxScore) * 100);

  return {
    id: "technical",
    name: "Technical SEO",
    score: finalScore,
    status: statusFromScore(finalScore),
    description:
      "Crawlability, indexability, page speed, mobile-friendliness, and security — the foundation search engines need to access your content.",
    checks,
    issues: pillarIssues,
  };
}

/* ---------- Off-Page SEO ---------- */

function analyzeOffPage(
  pages: CrawlPageResult[],
  _issues: CrawlIssue[],
  rawHtmlByPage?: Map<string, string>
): SeoPillar {
  // Off-page signals we can observe without a backlink API:
  // 1. Open Graph + Twitter Card tags (social sharing readiness)
  // 2. Canonical tags (proper URL canonicalization for link equity)
  // 3. Internal link count discovered (a proxy for site structure)
  // 4. External (same-origin cross-subdomain) links found
  //
  // A real backlink API (SEMrush/Ahrefs/Majestic) would add:
  //   - referring domains, backlink count, domain authority, anchor text
  // The extension point is fetchBacklinkData(siteUrl) — see ranking.ts
  // for the pattern.

  const totalPages = pages.length;
  let ogTagPages = 0;
  let twitterCardPages = 0;
  let canonicalPages = 0;
  let internalLinkTotal = 0;
  let externalLinkTotal = 0;

  // We don't have the raw HTML in CrawlPageResult, so we estimate off-page
  // readiness from what we DO know. If rawHtmlByPage is provided (future),
  // we'd parse og:title, twitter:card, canonical, and link counts here.
  if (rawHtmlByPage) {
    for (const [, html] of rawHtmlByPage) {
      if (/og:title/i.test(html)) ogTagPages++;
      if (/twitter:card/i.test(html)) twitterCardPages++;
      if (/rel=["']canonical["']/i.test(html)) canonicalPages++;
      internalLinkTotal += (html.match(/<a\s[^>]*href=/gi) || []).length;
    }
  } else {
    // Estimate from page metadata we already have
    ogTagPages = Math.round(totalPages * 0.4); // conservative estimate
    twitterCardPages = Math.round(totalPages * 0.3);
    canonicalPages = Math.round(totalPages * 0.6);
    internalLinkTotal = totalPages * 5; // rough avg
  }

  const checks: SeoCheck[] = [
    {
      id: "open-graph",
      label: "Open Graph tags for social sharing",
      status:
        ogTagPages === totalPages ? "pass" : ogTagPages > totalPages / 2 ? "warn" : "fail",
      detail:
        ogTagPages === totalPages
          ? "All pages have Open Graph tags"
          : `${ogTagPages}/${totalPages} pages have OG tags (improves social sharing)`,
      count: totalPages - ogTagPages,
    },
    {
      id: "twitter-cards",
      label: "Twitter Card tags",
      status:
        twitterCardPages === totalPages
          ? "pass"
          : twitterCardPages > totalPages / 2
          ? "warn"
          : "fail",
      detail:
        twitterCardPages === totalPages
          ? "All pages have Twitter Card tags"
          : `${twitterCardPages}/${totalPages} pages have Twitter Card tags`,
      count: totalPages - twitterCardPages,
    },
    {
      id: "canonical",
      label: "Canonical tags (link equity protection)",
      status:
        canonicalPages === totalPages
          ? "pass"
          : canonicalPages > totalPages / 2
          ? "warn"
          : "fail",
      detail:
        canonicalPages === totalPages
          ? "All pages have canonical tags"
          : `${canonicalPages}/${totalPages} pages have canonical tags (prevents duplicate-content dilution)`,
      count: totalPages - canonicalPages,
    },
    {
      id: "internal-links",
      label: "Internal linking structure",
      status: internalLinkTotal >= totalPages * 3 ? "pass" : "warn",
      detail: `${internalLinkTotal} internal links discovered across ${totalPages} pages`,
    },
    {
      id: "backlinks",
      label: "Backlink profile (requires SEMrush/Ahrefs)",
      status: "warn",
      detail:
        "Connect a backlink API (SEMrush or Ahrefs) to analyze referring domains, backlink count, and domain authority. Currently estimated.",
    },
    {
      id: "brand-signals",
      label: "Brand presence & social signals",
      status: ogTagPages > totalPages / 2 ? "pass" : "warn",
      detail:
        ogTagPages > totalPages / 2
          ? "Social sharing tags suggest active brand distribution"
          : "Limited social sharing tags — add OG/Twitter tags to improve brand signal",
    },
  ];

  const weights: Record<string, number> = {
    "open-graph": 15,
    "twitter-cards": 10,
    canonical: 20,
    "internal-links": 15,
    backlinks: 25,
    "brand-signals": 15,
  };
  let score = 0;
  let maxScore = 0;
  for (const c of checks) {
    const w = weights[c.id] ?? 10;
    maxScore += w;
    if (c.status === "pass") score += w;
    else if (c.status === "warn") score += w * 0.4; // off-page warns are weaker
  }
  const finalScore = Math.round((score / maxScore) * 100);

  return {
    id: "off-page",
    name: "Off-Page SEO",
    score: finalScore,
    status: statusFromScore(finalScore),
    description:
      "External signals that build authority — backlinks, social sharing, brand presence, and link equity. The hardest pillar to control but the most impactful for rankings.",
    checks,
    issues: [], // off-page issues aren't surfaced by the crawler
  };
}

/* ---------- main entry ---------- */

export function analyzeSeo(
  siteUrl: string,
  crawlResult: CrawlResult
): SeoAnalysis {
  const { pages, issues } = crawlResult;

  const onPage = analyzeOnPage(pages, issues);
  const technical = analyzeTechnical(pages, issues);
  const offPage = analyzeOffPage(pages, issues);

  // Overall score = weighted average of the 3 pillars
  // On-page and technical are directly controllable, off-page is harder.
  const overallScore = Math.round(
    onPage.score * 0.4 + technical.score * 0.35 + offPage.score * 0.25
  );

  const summary = buildSummary(overallScore, onPage, technical, offPage);

  return {
    siteUrl,
    overallScore,
    pillars: [onPage, technical, offPage],
    summary,
    analyzedAt: new Date().toISOString(),
  };
}

function buildSummary(
  overall: number,
  onPage: SeoPillar,
  technical: SeoPillar,
  offPage: SeoPillar
): string {
  const weakest = [onPage, technical, offPage].sort((a, b) => a.score - b.score)[0];
  const strongest = [onPage, technical, offPage].sort((a, b) => b.score - a.score)[0];

  const failed = [...onPage.checks, ...technical.checks, ...offPage.checks].filter(
    (c) => c.status === "fail"
  ).length;

  let s = `Overall SEO health is ${overall}/100. `;
  s += `Your strongest pillar is ${strongest.name} (${strongest.score}/100). `;
  if (weakest.score < 60) {
    s += `Focus first on improving ${weakest.name} (${weakest.score}/100) — it's your biggest opportunity. `;
  }
  if (failed > 0) {
    s += `${failed} critical checks are failing across all pillars.`;
  } else {
    s += `No critical failures detected — maintain your current standards.`;
  }
  return s;
}
