import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";
import { analyzeAudit } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

/**
 * Run AI analysis on the latest audit's issues and return prioritized
 * recommendations. Uses the real z-ai-web-dev-sdk (server-side only).
 */
export async function POST(_req: Request, { params }: Params) {
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
    if (!audit) return fail("No audit found for this site yet. Run a crawl first.", 404, "no_audit");

    const analysis = await analyzeAudit({
      siteUrl: site.url,
      issues: audit.issues.map((i) => ({
        type: i.type,
        severity: i.severity,
        url: i.url,
        detail: i.detail,
      })),
    });

    return ok({ analysis, auditId: audit.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI analysis failed";
    if (msg.includes("sandbox is inactive") || msg.includes("inactive")) {
      return fail(
        "The AI service is waking up. Please try again in a few seconds.",
        503,
        "ai_warming_up"
      );
    }
    if (msg.includes("non-JSON") || msg.includes("empty response")) {
      return fail("The AI service returned an unexpected response. Please try again.", 502, "ai_parse_error");
    }
    return handleError(err);
  }
}
