import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, handleError, assertSafeUrl } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");

    const sites = await db.site.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        audits: {
          orderBy: { runAt: "desc" },
          take: 1,
          select: { id: true, score: true, runAt: true },
        },
        _count: { select: { keywords: true } },
      },
    });
    return ok({ sites });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");

    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid JSON body", 400);

    const url = String(body.url ?? "").trim();
    const name = String(body.name ?? "").trim();
    const sitemapUrl = body.sitemapUrl ? String(body.sitemapUrl).trim() : null;
    const crawlFrequency = String(body.crawlFrequency ?? "weekly");

    if (!url) return fail("URL is required", 422, "missing_url");
    let safe: URL;
    try {
      safe = assertSafeUrl(url);
    } catch (e) {
      return fail((e as Error).message, 422, "invalid_url");
    }
    if (!name) return fail("Site name is required", 422, "missing_name");

    const site = await db.site.create({
      data: {
        userId: user.id,
        url: safe.href,
        name,
        sitemapUrl,
        crawlFrequency,
      },
    });
    return ok({ site });
  } catch (err) {
    return handleError(err);
  }
}
