import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";
import { historicalSeries } from "@/lib/ranking";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

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

    const keywords = await db.keyword.findMany({
      where: { siteId: id },
      orderBy: { createdAt: "desc" },
      include: {
        rankings: { orderBy: { checkedAt: "asc" } },
      },
    });
    return ok({ keywords });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");
    const { id } = await params;

    const site = await db.site.findFirst({
      where: { id, userId: user.id },
      select: { id: true, url: true },
    });
    if (!site) return fail("Site not found", 404, "not_found");

    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid JSON body", 400);
    const keyword = String(body.keyword ?? "").trim();
    const targetUrl = body.targetUrl ? String(body.targetUrl).trim() : null;
    if (!keyword) return fail("Keyword is required", 422, "missing_keyword");

    const created = await db.keyword.create({
      data: { siteId: id, keyword, targetUrl },
    });

    // Seed ~14 days of historical rankings so the trend chart has data
    // immediately. Marked as simulated (no live API key by default).
    const series = historicalSeries(keyword, site.url, 14);
    if (series.length) {
      await db.keywordRanking.createMany({
        data: series.map((s) => ({
          keywordId: created.id,
          position: s.position,
          checkedAt: new Date(s.date + "T09:00:00Z"),
        })),
      });
    }

    const withRankings = await db.keyword.findUnique({
      where: { id: created.id },
      include: { rankings: { orderBy: { checkedAt: "asc" } } },
    });
    return ok({ keyword: withRankings });
  } catch (err) {
    return handleError(err);
  }
}
