import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");
    const { id } = await params;

    const site = await db.site.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!site) return fail("Site not found", 404, "not_found");

    const audit = await db.audit.findFirst({
      where: { siteId: id },
      orderBy: { runAt: "desc" },
      include: { issues: true },
    });
    if (!audit) return ok({ audit: null });

    return ok({
      audit: {
        ...audit,
        summary: safeParse(audit.summaryJson),
      },
    });
  } catch (err) {
    return handleError(err);
  }
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
