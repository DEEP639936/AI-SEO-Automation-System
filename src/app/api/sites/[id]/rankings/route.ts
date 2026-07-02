import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";
import { checkRanking } from "@/lib/ranking";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * Returns every keyword for the site with its full ranking history,
 * shaped for charting: [{ keyword, id, series: [{date, position}] }].
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

    const keywords = await db.keyword.findMany({
      where: { siteId: id },
      orderBy: { createdAt: "asc" },
      include: { rankings: { orderBy: { checkedAt: "asc" } } },
    });

    const chart = keywords.map((k) => ({
      id: k.id,
      keyword: k.keyword,
      targetUrl: k.targetUrl,
      latest: k.rankings.length ? k.rankings[k.rankings.length - 1].position : null,
      series: k.rankings.map((r) => ({
        date: r.checkedAt.toISOString().slice(0, 10),
        position: r.position,
      })),
    }));

    return ok({ siteUrl: site.url, keywords: chart });
  } catch (err) {
    return handleError(err);
  }
}
