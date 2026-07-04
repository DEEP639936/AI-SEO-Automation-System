import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";
import { generateSeoContent } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");

    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid JSON body", 400);
    const keyword = String(body.keyword ?? "").trim();
    const context = body.context ? String(body.context).trim() : undefined;
    const tone = body.tone ? String(body.tone).trim() : undefined;
    const siteId = body.siteId ? String(body.siteId) : null;

    if (!keyword) return fail("Keyword is required", 422, "missing_keyword");

    const content = await generateSeoContent({ keyword, context, tone });

    const record = await db.contentGeneration.create({
      data: {
        userId: user.id,
        siteId,
        keyword,
        prompt: context || `Generate content for keyword: ${keyword}`,
        mode: "generate",
        output: JSON.stringify(content),
      },
    });

    return ok({ content, id: record.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    if (msg.includes("sandbox is inactive") || msg.includes("inactive")) {
      return fail(
        "The AI service is waking up. Please try again in a few seconds.",
        503,
        "ai_warming_up"
      );
    }
    if (msg.includes("non-JSON") || msg.includes("empty response")) {
      return fail("The AI service returned an unexpected response. Please try again.", 502, "ai_parse_error");
    }
    return handleError(err);
  }
}
