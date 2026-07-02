import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";
import { checkRanking } from "@/lib/ranking";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * Record a fresh ranking check for a keyword. Without a live SEO API key
 * the position comes from a deterministic, evolving simulation (clearly
 * labeled "simulated" in the UI). With GSC/SEMrush keys present, the real
 * fetch path would be wired in lib/ranking.ts.
 */
export async function POST(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");
    const { id } = await params;

    const keyword = await db.keyword.findUnique({
      where: { id },
      include: {
        site: { select: { userId: true, url: true } },
        rankings: { orderBy: { checkedAt: "desc" }, take: 1 },
      },
    });
    if (!keyword || keyword.site.userId !== user.id) {
      return fail("Keyword not found", 404, "not_found");
    }

    const last = keyword.rankings[0]?.position;
    const result = checkRanking(keyword.keyword, keyword.site.url, last);

    const ranking = await db.keywordRanking.create({
      data: {
        keywordId: id,
        position: result.position,
      },
    });

    return ok({ ranking, source: result.source });
  } catch (err) {
    return handleError(err);
  }
}
