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

    const report = await db.report.findFirst({
      where: { id, site: { userId: user.id } },
      include: { site: { select: { name: true, url: true } } },
    });
    if (!report) return fail("Report not found", 404, "not_found");

    return ok({ report });
  } catch (err) {
    return handleError(err);
  }
}
