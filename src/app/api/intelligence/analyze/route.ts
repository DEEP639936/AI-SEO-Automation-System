import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";
import { spawn } from "child_process";

export const runtime = "nodejs";
export const maxDuration = 45;

/**
 * Content Intelligence proxy — calls the Python ML service's four
 * specialized endpoints (NLP, ML, DL, RAG) sequentially and merges results.
 *
 * If the Python service isn't running, we attempt to start it on-demand
 * (the sandbox reaps idle background processes). Thread-limiting env vars
 * prevent BLAS/numpy OOM-kills.
 */
const ML_BASE = "http://127.0.0.1:8001";
const SERVICE_DIR = "/home/z/my-project/mini-services/seo-ml-service";

let startedOnce = false;

async function ensureService(): Promise<boolean> {
  // Quick health check.
  try {
    const r = await fetch(`${ML_BASE}/health`, { signal: AbortSignal.timeout(1500) });
    if (r.ok) return true;
  } catch {
    /* down — try to start */
  }
  // Spawn the service (detached so it survives this request).
  if (!startedOnce) {
    try {
      const env = {
        ...process.env,
        OMP_NUM_THREADS: "1",
        OPENBLAS_NUM_THREADS: "1",
        MKL_NUM_THREADS: "1",
        NUMEXPR_NUM_THREADS: "1",
      };
      const child = spawn(
        "python3",
        ["-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "1"],
        { cwd: SERVICE_DIR, env, detached: true, stdio: "ignore" }
      );
      child.unref();
      startedOnce = true;
    } catch (e) {
      console.error("[intelligence] failed to spawn ML service:", e);
    }
  }
  // Wait for it to come up (poll health for up to ~15s).
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const r = await fetch(`${ML_BASE}/health`, { signal: AbortSignal.timeout(1500) });
      if (r.ok) return true;
    } catch {
      /* keep waiting */
    }
  }
  return false;
}

async function postJSON(path: string, body: unknown, timeoutMs = 12000) {
  const res = await fetch(`${ML_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${path} → ${res.status}: ${detail}`);
  }
  return res.json();
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");

    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid JSON body", 400);

    const text = String(body.text ?? "");
    const keyword = body.keyword ? String(body.keyword) : undefined;
    const headingCount = Number(body.headingCount ?? 0);

    if (!text.trim()) return fail("Text is required", 422, "missing_text");

    // Ensure the Python service is running (start on-demand if needed).
    const up = await ensureService();
    if (!up) {
      return fail(
        "The Python ML service is unavailable. It may be starting up — please retry in a few seconds.",
        503,
        "ml_service_unavailable"
      );
    }

    // 1. NLP
    let nlp: unknown = null;
    try {
      nlp = await postJSON("/nlp/analyze", { text, keyword });
    } catch (e) {
      console.error("[intelligence] NLP failed:", e);
    }

    const nlpAny = nlp as
      | {
          text_stats?: Record<string, number>;
          readability?: { flesch_reading_ease?: number };
          keywords?: { is_target?: boolean; density?: number }[];
          top_sentences?: string[];
        }
      | null;
    const stats = nlpAny?.text_stats ?? {};
    const readability = nlpAny?.readability ?? {};
    let kwDensity = 0.0;
    for (const kw of nlpAny?.keywords ?? []) {
      if (kw.is_target && kw.density != null) {
        kwDensity = kw.density / 100.0;
        break;
      }
    }
    const features = {
      word_count: stats.word_count ?? 0,
      keyword_density: kwDensity,
      flesch_reading_ease: readability.flesch_reading_ease ?? 50,
      heading_count: headingCount,
      lexical_diversity: stats.lexical_diversity ?? 0.5,
      avg_words_per_sentence: stats.avg_words_per_sentence ?? 15,
    };

    // 2. ML
    let ml: unknown = null;
    try {
      ml = await postJSON("/ml/score", features);
    } catch (e) {
      console.error("[intelligence] ML failed:", e);
    }

    // 3. Deep Learning
    let dl: unknown = null;
    try {
      dl = await postJSON("/dl/classify", features);
    } catch (e) {
      console.error("[intelligence] DL failed:", e);
    }

    // 4. RAG
    const topSentence = nlpAny?.top_sentences?.[0] ?? "";
    const query = `${keyword ?? ""} ${topSentence}`.trim();
    let rag: unknown = null;
    try {
      rag = await postJSON("/rag/retrieve", { query, top_k: 3 });
    } catch (e) {
      console.error("[intelligence] RAG failed:", e);
    }

    return ok({
      ok: true,
      nlp: nlp
        ? {
            keywords: (nlp as { keywords?: unknown[] }).keywords ?? [],
            key_phrases: (nlp as { key_phrases?: string[] }).key_phrases ?? [],
            text_stats: (nlp as { text_stats?: Record<string, number> }).text_stats ?? {},
            readability: (nlp as { readability?: Record<string, unknown> }).readability ?? {},
            top_sentences: (nlp as { top_sentences?: string[] }).top_sentences ?? [],
          }
        : null,
      ml: ml
        ? {
            predicted_score: (ml as { predicted_score: number }).predicted_score,
            confidence_band: (ml as { confidence_band: string }).confidence_band,
            feature_contributions: (ml as { feature_contributions?: Record<string, number> }).feature_contributions ?? {},
            model: (ml as { model: string }).model,
            training_mae: (ml as { training_mae: number }).training_mae,
            training_r2: (ml as { training_r2: number }).training_r2,
          }
        : null,
      deep_learning: dl
        ? {
            quality_probability: (dl as { quality_probability: number }).quality_probability,
            quality_label: (dl as { quality_label: string }).quality_label,
            confidence: (dl as { confidence: number }).confidence,
            model: (dl as { model: string }).model,
          }
        : null,
      rag: rag
        ? {
            retrieved: (rag as { retrieved?: unknown[] }).retrieved ?? [],
            augmented_prompt_context: (rag as { augmented_prompt_context?: string }).augmented_prompt_context ?? "",
            retriever: (rag as { retriever?: string }).retriever ?? "TF-IDF cosine retrieval",
          }
        : null,
    });
  } catch (err) {
    console.error("[intelligence] proxy error:", err);
    return handleError(err);
  }
}
