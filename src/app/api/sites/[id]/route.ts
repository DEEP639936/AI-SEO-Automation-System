import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

async function getOwnedSite(userId: string, id: string) {
  return db.site.findFirst({ where: { id, userId } });
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");
    const { id } = await params;
    const site = await getOwnedSite(user.id, id);
    if (!site) return fail("Site not found", 404, "not_found");
    return ok({ site });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");
    const { id } = await params;
    const site = await getOwnedSite(user.id, id);
    if (!site) return fail("Site not found", 404, "not_found");

    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.url === "string") data.url = body.url;
    if (body.sitemapUrl !== undefined) data.sitemapUrl = body.sitemapUrl;
    if (typeof body.crawlFrequency === "string")
      data.crawlFrequency = body.crawlFrequency;

    const updated = await db.site.update({ where: { id }, data });
    return ok({ site: updated });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");
    const { id } = await params;
    const site = await getOwnedSite(user.id, id);
    if (!site) return fail("Site not found", 404, "not_found");
    await db.site.delete({ where: { id } });
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
