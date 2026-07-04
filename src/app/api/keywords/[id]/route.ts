import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");
    const { id } = await params;

    // Ensure ownership via the keyword's site
    const keyword = await db.keyword.findUnique({
      where: { id },
      include: { site: { select: { userId: true } } },
    });
    if (!keyword || keyword.site.userId !== user.id) {
      return fail("Keyword not found", 404, "not_found");
    }
    await db.keyword.delete({ where: { id } });
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
