import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";
import { improveContent } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");

    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid JSON body", 400);
    const content = String(body.content ?? "");
    const keyword = String(body.keyword ?? "").trim();
    const siteId = body.siteId ? String(body.siteId) : null;

    if (!content.trim()) return fail("Content is required", 422, "missing_content");
    if (!keyword) return fail("Keyword is required", 422, "missing_keyword");

    const result = await improveContent({ content, keyword });

    const record = await db.contentGeneration.create({
      data: {
        userId: user.id,
        siteId,
        keyword,
        prompt: content.slice(0, 2000),
        mode: "improve",
        output: JSON.stringify(result),
      },
    });

    return ok({ result: result, id: record.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI improvement failed";
    if (msg.includes("non-JSON")) {
      return fail("The AI service returned an unexpected response. Please try again.", 502, "ai_parse_error");
    }
    return handleError(err);
  }
}
