import ZAI from "z-ai-web-dev-sdk";

/**
 * AI service utilities for SEO content generation + audit analysis.
 *
 * Server-only. Wraps `z-ai-web-dev-sdk` chat completions and instructs
 * the model to return strict JSON, which we parse defensively.
 */

// Warm up the z-ai sandbox on module load so the first real request
// doesn't hit "sandbox is inactive". This is fire-and-forget.
let _warmupPromise: Promise<void> | null = null;
export function warmupAI(): Promise<void> {
  if (!_warmupPromise) {
    _warmupPromise = (async () => {
      try {
        const zai = await ZAI.create();
        await zai.chat.completions.create({
          messages: [{ role: "user", content: "ping" }],
          thinking: { type: "disabled" },
        });
        console.log("[ai] sandbox warmed up");
      } catch (e) {
        // Non-fatal — the first real call will retry.
        console.warn("[ai] warmup failed (non-fatal):", e instanceof Error ? e.message : e);
      }
    })();
  }
  return _warmupPromise;
}
// Kick off warmup immediately on import.
warmupAI();

export interface GeneratedContent {
  titleTag: string;
  metaDescription: string;
  h1: string;
  body: string; // markdown body copy
  keywordsSuggested: string[];
}

export interface ImprovedContent {
  improved: string; // markdown
  changes: string[]; // bullet list of changes made
}

export interface AuditAnalysis {
  summary: string;
  recommendations: {
    priority: "high" | "medium" | "low";
    title: string;
    detail: string;
  }[];
}

/* ---------- helpers ---------- */

/**
 * Parses JSON from the model's text response. Tries a direct `JSON.parse`,
 * then falls back to extracting the first `{...}` block via regex.
 * Returns `null` if neither succeeds.
 */
function extractJson(text: string): unknown {
  if (!text) return null;
  // 1. direct parse
  try {
    return JSON.parse(text);
  } catch {
    // fall through
  }
  // 2. strip common markdown fences ```json ... ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // fall through
    }
  }
  // 3. first {...} block
  const block = text.match(/\{[\s\S]*\}/);
  if (block) {
    try {
      return JSON.parse(block[0]);
    } catch {
      // fall through
    }
  }
  return null;
}

async function callAI(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  // Retry with a fresh SDK instance — the z-ai sandbox can go inactive
  // between calls, returning {"error":"sandbox is inactive"}. A new
  // ZAI.create() reactivates the session.
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const zai = await ZAI.create();
      const completion: {
        choices?: { message?: { content?: string } }[];
      } = await zai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        thinking: { type: "disabled" },
      });
      const content = completion?.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string" || content.trim() === "") {
        throw new Error("AI returned an empty response");
      }
      // Detect the sandbox-inactive error echoed back as content.
      if (content.includes('"sandbox is inactive"')) {
        throw new Error("sandbox is inactive");
      }
      return content;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      // Retry only on transient sandbox errors.
      if (msg.includes("sandbox is inactive") || msg.includes("inactive")) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("AI service unavailable after retries");
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

/* ---------- generateSeoContent ---------- */

export async function generateSeoContent(args: {
  keyword: string;
  context?: string;
  tone?: string;
}): Promise<GeneratedContent> {
  const tone = args.tone?.trim() || "professional";
  const keyword = args.keyword.trim();
  if (!keyword) {
    throw new Error("generateSeoContent: keyword is required");
  }

  const systemPrompt =
    "You are an expert SEO copywriter with 10+ years of experience in search engine optimization, content marketing, and on-page SEO. You write compelling, keyword-optimized content that ranks well and converts readers. You ALWAYS respond with strict JSON only — no markdown fences, no prose, no commentary.";

  const userPrompt = `Generate optimized SEO content for the primary keyword: "${keyword}".
${args.context ? `Additional context: ${args.context}\n` : ""}Desired tone: ${tone}.

Return a JSON object with EXACTLY these keys:
- "titleTag": string, an SEO-optimized HTML <title> tag (<=60 characters, include the keyword naturally)
- "metaDescription": string, a compelling meta description (<=155 characters, include the keyword)
- "h1": string, a single H1 heading for the page (include the keyword or a close variant)
- "body": string, markdown-formatted body copy of 300-500 words that naturally uses the keyword. Include at least two "## " subheadings and a short bullet list where appropriate. Do NOT wrap the body in a code fence.
- "keywordsSuggested": array of 5-8 related long-tail keyword strings

Respond with ONLY the JSON object. No markdown fences. No prose.`;

  let raw: string;
  try {
    raw = await callAI(systemPrompt, userPrompt);
  } catch (err) {
    console.error("[ai.generateSeoContent] AI call failed:", err);
    throw err;
  }

  const parsed = extractJson(raw);
  if (!parsed || typeof parsed !== "object") {
    console.error("[ai.generateSeoContent] non-JSON output:", raw);
    throw new Error("AI returned non-JSON output");
  }
  const obj = parsed as Record<string, unknown>;

  return {
    titleTag: asString(obj.titleTag),
    metaDescription: asString(obj.metaDescription),
    h1: asString(obj.h1),
    body: asString(obj.body),
    keywordsSuggested: asStringArray(obj.keywordsSuggested),
  };
}

/* ---------- improveContent ---------- */

export async function improveContent(args: {
  content: string;
  keyword: string;
}): Promise<ImprovedContent> {
  const keyword = args.keyword.trim();
  const content = args.content;
  if (!content || !content.trim()) {
    throw new Error("improveContent: content is required");
  }
  if (!keyword) {
    throw new Error("improveContent: keyword is required");
  }

  const systemPrompt =
    "You are an expert SEO editor. You improve existing content for better search rankings and readability while preserving the original meaning. You ALWAYS respond with strict JSON only — no markdown fences, no prose, no commentary.";

  const userPrompt = `Improve the following content for the target keyword: "${keyword}".

Original content:
"""
${content}
"""

Improvement goals:
- Integrate the keyword naturally (avoid keyword stuffing; aim for ~1-2% density).
- Improve structure: ensure a clear H1, logical H2/H3 hierarchy, short paragraphs, and bullet lists where helpful.
- Strengthen the opening hook and the closing call-to-action.
- Fix awkward phrasing, passive voice, and grammatical issues.
- Preserve the original meaning and factual claims.

Return a JSON object with EXACTLY these keys:
- "improved": string, the full improved content in markdown (do NOT wrap in a code fence)
- "changes": array of strings, each a concise bullet describing a specific change you made (e.g. "Added H2 subheading for 'Benefits' section")

Respond with ONLY the JSON object. No markdown fences. No prose.`;

  let raw: string;
  try {
    raw = await callAI(systemPrompt, userPrompt);
  } catch (err) {
    console.error("[ai.improveContent] AI call failed:", err);
    throw err;
  }

  const parsed = extractJson(raw);
  if (!parsed || typeof parsed !== "object") {
    console.error("[ai.improveContent] non-JSON output:", raw);
    throw new Error("AI returned non-JSON output");
  }
  const obj = parsed as Record<string, unknown>;

  return {
    improved: asString(obj.improved, content),
    changes: asStringArray(obj.changes),
  };
}

/* ---------- analyzeAudit ---------- */

export async function analyzeAudit(args: {
  siteUrl: string;
  issues: { type: string; severity: string; url: string; detail: string }[];
}): Promise<AuditAnalysis> {
  const siteUrl = args.siteUrl?.trim();
  if (!siteUrl) {
    throw new Error("analyzeAudit: siteUrl is required");
  }
  // Cap to keep the prompt compact — sort criticals first.
  const allIssues = args.issues ?? [];
  const severityRank: Record<string, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  const sorted = [...allIssues].sort(
    (a, b) =>
      (severityRank[a.severity] ?? 3) - (severityRank[b.severity] ?? 3)
  );
  const capped = sorted.slice(0, 30);
  const issuesJson = JSON.stringify(
    capped.map((i) => ({
      type: i.type,
      severity: i.severity,
      url: i.url,
      detail: i.detail,
    }))
  );

  const systemPrompt =
    "You are a senior technical SEO consultant. You analyze site crawl reports and produce prioritized, actionable recommendations. You ALWAYS respond with strict JSON only — no markdown fences, no prose, no commentary.";

  const userPrompt = `Analyze the following SEO crawl audit for the site: ${siteUrl}

Crawl issues (JSON, capped at 30 entries):
${issuesJson}

Total issues detected across the crawl: ${allIssues.length}.

Return a JSON object with EXACTLY these keys:
- "summary": string, 2-3 sentences summarizing the site's overall SEO health and the most impactful problems
- "recommendations": array of 4-8 objects, each with:
  - "priority": "high" | "medium" | "low"
  - "title": string, short title (<=10 words)
  - "detail": string, 1-2 sentences explaining the fix and why it matters

Order recommendations by priority (high first). Respond with ONLY the JSON object. No markdown fences. No prose.`;

  let raw: string;
  try {
    raw = await callAI(systemPrompt, userPrompt);
  } catch (err) {
    console.error("[ai.analyzeAudit] AI call failed:", err);
    throw err;
  }

  const parsed = extractJson(raw);
  if (!parsed || typeof parsed !== "object") {
    console.error("[ai.analyzeAudit] non-JSON output:", raw);
    throw new Error("AI returned non-JSON output");
  }
  const obj = parsed as Record<string, unknown>;

  const validPriorities = new Set(["high", "medium", "low"]);
  const recommendations = Array.isArray(obj.recommendations)
    ? (obj.recommendations as unknown[])
        .filter((r): r is Record<string, unknown> => r !== null && typeof r === "object")
        .map((r) => ({
          priority: validPriorities.has(r.priority as string)
            ? (r.priority as "high" | "medium" | "low")
            : "medium",
          title: asString(r.title, "Untitled recommendation"),
          detail: asString(r.detail),
        }))
    : [];

  return {
    summary: asString(
      obj.summary,
      `Audit complete for ${siteUrl} with ${allIssues.length} issues detected.`
    ),
    recommendations,
  };
}
