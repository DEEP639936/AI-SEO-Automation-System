import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";
import { analyzeSeo } from "@/lib/seo-analyzer";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * Returns the 3-pillar SEO analysis (On-Page, Off-Page, Technical) for the
 * site's latest crawl. Derived from the stored audit + its issues.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");
    const { id } = await params;

    const site = await db.site.findFirst({
      where: { id, userId: user.id },
      select: { id: true, url: true },
    });
    if (!site) return fail("Site not found", 404, "not_found");

    const audit = await db.audit.findFirst({
      where: { siteId: id },
      orderBy: { runAt: "desc" },
      include: { issues: true },
    });
    if (!audit) {
      return fail(
        "No audit found for this site yet. Run a crawl first to see SEO analysis.",
        404,
        "no_audit"
      );
    }

    // Reconstruct a CrawlResult-shaped object from the stored audit
    const summary =
      typeof audit.summaryJson === "string"
        ? (() => {
            try {
              return JSON.parse(audit.summaryJson);
            } catch {
              return null;
            }
          })()
        : null;

    const pages = (summary?.pages ?? []).map(
      (p: {
        url: string;
        status: number;
        loadMs: number;
        title: string | null;
        https: boolean;
        h1Count: number;
      }) => ({
        url: p.url,
        status: p.status,
        loadMs: p.loadMs,
        title: p.title,
        metaDescription: null, // not stored per-page in summary
        h1Count: p.h1Count,
        https: p.https,
        issues: [],
      })
    );

    const analysis = analyzeSeo(site.url, {
      pages,
      issues: audit.issues.map((i) => ({
        type: i.type,
        severity: i.severity as "critical" | "warning" | "info",
        url: i.url,
        detail: i.detail,
      })),
      score: audit.score,
      crawledAt: audit.runAt.toISOString(),
      durationMs: audit.durationMs,
    });

    return ok({ analysis, auditId: audit.id, crawledAt: audit.runAt });
  } catch (err) {
    return handleError(err);
  }
}
