import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";
import { crawlSite, type CrawlIssue } from "@/lib/crawler";

export const runtime = "nodejs";
// Crawling can take a while — give it room.
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

/**
 * Trigger a real crawl for the site, persist the audit + issues, and
 * return the full result. The frontend polls `/audits` or reads the
 * returned audit to render the issue table.
 */
export async function POST(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");
    const { id } = await params;

    const site = await db.site.findFirst({ where: { id, userId: user.id } });
    if (!site) return fail("Site not found", 404, "not_found");

    const result = await crawlSite(site.url, { maxPages: 8, timeoutMs: 8000 });

    // severity counts for the summary blob
    const counts = { critical: 0, warning: 0, info: 0 };
    for (const i of result.issues) counts[i.severity]++;

    const audit = await db.audit.create({
      data: {
        siteId: site.id,
        score: result.score,
        pagesCrawled: result.pages.length,
        durationMs: result.durationMs,
        summaryJson: JSON.stringify({
          counts,
          crawledAt: result.crawledAt,
          pages: result.pages.map((p) => ({
            url: p.url,
            status: p.status,
            loadMs: p.loadMs,
            title: p.title,
            https: p.https,
            h1Count: p.h1Count,
          })),
        }),
        issues: {
          create: result.issues.map((i: CrawlIssue) => ({
            type: i.type,
            severity: i.severity,
            url: i.url,
            detail: i.detail,
          })),
        },
      },
      include: { issues: true },
    });

    await db.site.update({
      where: { id: site.id },
      data: { lastCrawlAt: new Date() },
    });

    return ok({ audit, pages: result.pages });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Crawl failed";
    if (msg.startsWith("Invalid URL")) return fail(msg, 422, "invalid_url");
    return handleError(err);
  }
}
