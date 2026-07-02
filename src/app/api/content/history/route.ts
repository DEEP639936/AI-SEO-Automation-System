import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");

    const items = await db.contentGeneration.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        keyword: true,
        mode: true,
        prompt: true,
        output: true,
        createdAt: true,
        siteId: true,
      },
    });
    return ok({ items });
  } catch (err) {
    return handleError(err);
  }
}
