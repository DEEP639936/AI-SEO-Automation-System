"""
SEOScout ML Service — FastAPI application.

Exposes NLP, Machine Learning, Deep Learning, and RAG endpoints that the
Next.js frontend calls through the gateway (XTransformPort=8001).

Run:  python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
"""
from __future__ import annotations

import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .nlp import analyze_content
from .machine_learning import score_content, train_model, load_model
from .deep_learning import SeoQualityNet, classify as dl_classify
from .rag import retrieve as rag_retrieve
from . import train as train_module

app = FastAPI(
    title="SEOScout ML Service",
    description=(
        "Python backend providing NLP (keyword extraction, readability), "
        "Machine Learning (RandomForest SEO scoring), Deep Learning "
        "(from-scratch NumPy MLP quality classifier), and RAG "
        "(TF-IDF retrieval over an SEO knowledge base) for the SEOScout "
        "SEO automation platform."
    ),
    version="1.0.0",
)

# CORS — allow the Next.js frontend (same origin via gateway, plus localhost).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------------------- startup

@app.on_event("startup")
def _startup() -> None:
    """Load only the lightweight DL weights at startup. The ML RandomForest
    is loaded per-request and released to keep memory stable on
    RAM-constrained hosts."""
    weights_dir = os.path.join(os.path.dirname(__file__), "..", "weights")
    os.makedirs(weights_dir, exist_ok=True)

    # Ensure ML model is trained (but don't keep it loaded).
    if not os.path.exists(os.path.join(weights_dir, "ml_seo_model.joblib")):
        print("[startup] Training ML model...")
        train_model(verbose=False)
    print("[startup] ML model available (lazy-loaded per request).")

    # Train DL network if weights missing (tiny .npy files — safe to keep).
    net = SeoQualityNet.load()
    if net is None:
        print("[startup] Training DL network...")
        train_module.main()
        net = SeoQualityNet.load()
    app.state.dl_net = net
    print("[startup] DL MLP loaded.")


# ----------------------------------------------------------------- schemas

class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="The content text to analyze")
    keyword: Optional[str] = Field(None, description="Target keyword for density calc")


class ScoreRequest(BaseModel):
    word_count: int = 0
    keyword_density: float = 0.0
    flesch_reading_ease: float = 50.0
    heading_count: int = 0
    lexical_diversity: float = 0.5
    avg_words_per_sentence: float = 15.0


class FullAnalyzeRequest(BaseModel):
    text: str
    keyword: Optional[str] = None
    heading_count: int = 0


class RagRequest(BaseModel):
    query: str = Field(..., description="Query to retrieve relevant SEO guidance for")
    top_k: int = Field(3, ge=1, le=8)


# ----------------------------------------------------------------- routes

@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "seo-ml-service",
        "version": "1.0.0",
        "capabilities": ["nlp", "ml", "deep_learning", "rag"],
    }


@app.post("/nlp/analyze")
def nlp_analyze(req: AnalyzeRequest) -> dict:
    """NLP: keyword extraction (TF-IDF + RAKE), readability (Flesch),
    text statistics, and extractive summarization."""
    try:
        result = analyze_content(req.text, keyword=req.keyword)
        return {
            "ok": True,
            "keywords": result.keywords,
            "key_phrases": result.key_phrases,
            "text_stats": result.text_stats,
            "readability": result.readability,
            "top_sentences": result.top_sentences,
        }
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"NLP analysis failed: {e}")


@app.post("/ml/score")
def ml_score(req: ScoreRequest) -> dict:
    """Machine Learning: predict a 0-100 SEO quality score from content
    features using a trained scikit-learn RandomForest."""
    try:
        result = score_content(req.model_dump())
        return {
            "ok": True,
            "predicted_score": result.predicted_score,
            "confidence_band": result.confidence_band,
            "feature_contributions": result.feature_contributions,
            "model": result.model,
            "training_mae": result.training_mae,
            "training_r2": result.training_r2,
        }
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"ML scoring failed: {e}")


@app.post("/dl/classify")
def dl_classify_route(req: ScoreRequest) -> dict:
    """Deep Learning: classify content quality (Low/Medium/High) using a
    from-scratch NumPy feedforward neural network."""
    net: SeoQualityNet | None = getattr(app.state, "dl_net", None)
    if net is None:
        raise HTTPException(status_code=503, detail="DL model not loaded")
    try:
        result = dl_classify(net, req.model_dump())
        return {
            "ok": True,
            "quality_probability": result.quality_probability,
            "quality_label": result.quality_label,
            "confidence": result.confidence,
            "model": result.model,
        }
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"DL classification failed: {e}")


@app.post("/rag/retrieve")
def rag_retrieve_route(req: RagRequest) -> dict:
    """RAG (retrieval): return the top-k most relevant SEO best-practice
    documents for the given query, plus a ready-to-inject context block."""
    try:
        result = rag_retrieve(req.query, top_k=req.top_k)
        return {
            "ok": True,
            "query": result.query,
            "retrieved": result.retrieved,
            "augmented_prompt_context": result.augmented_prompt_context,
            "retriever": result.retriever,
        }
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"RAG retrieval failed: {e}")


@app.post("/analyze")
def full_analyze(req: FullAnalyzeRequest) -> dict:
    """One-shot: run NLP + ML + DL + RAG in a single call and return a
    unified 'Content Intelligence' report. Each stage is wrapped so a
    failure in one doesn't crash the worker — partial results are returned."""
    import gc

    # 1. NLP (skip extractive summary to save memory)
    try:
        nlp = analyze_content(req.text, keyword=req.keyword, summarize=False)
        stats = nlp.text_stats
        readability = nlp.readability
        kw_density = 0.0
        for kw in nlp.keywords:
            if kw.get("is_target"):
                kw_density = float(kw.get("density", 0)) / 100.0
                break
        nlp_block = {
            "keywords": nlp.keywords,
            "key_phrases": nlp.key_phrases,
            "text_stats": stats,
            "readability": readability,
            "top_sentences": nlp.top_sentences,
        }
    except Exception as e:  # noqa: BLE001
        print(f"[analyze] NLP failed: {e}")
        stats = {}
        readability = {"flesch_reading_ease": 50, "flesch_kincaid_grade": 10, "interpretation": "n/a"}
        kw_density = 0.0
        nlp_block = {"keywords": [], "key_phrases": [], "text_stats": {}, "readability": readability, "top_sentences": []}

    features = {
        "word_count": stats.get("word_count", 0),
        "keyword_density": kw_density,
        "flesch_reading_ease": readability.get("flesch_reading_ease", 50),
        "heading_count": req.heading_count,
        "lexical_diversity": stats.get("lexical_diversity", 0.5),
        "avg_words_per_sentence": stats.get("avg_words_per_sentence", 15),
    }

    # 2. ML score (skip permutation contributions in combined mode to save memory)
    ml_block = None
    try:
        ml = score_content(features, with_contributions=False)
        ml_block = {
            "predicted_score": ml.predicted_score,
            "confidence_band": ml.confidence_band,
            "feature_contributions": {},  # omitted in combined mode
            "model": ml.model,
            "training_mae": ml.training_mae,
            "training_r2": ml.training_r2,
        }
    except Exception as e:  # noqa: BLE001
        print(f"[analyze] ML failed: {e}")
    gc.collect()

    # 3. DL classify
    dl_block = None
    try:
        net: SeoQualityNet | None = getattr(app.state, "dl_net", None)
        if net:
            dl = dl_classify(net, features)
            dl_block = {
                "quality_probability": dl.quality_probability,
                "quality_label": dl.quality_label,
                "confidence": dl.confidence,
                "model": dl.model,
            }
    except Exception as e:  # noqa: BLE001
        print(f"[analyze] DL failed: {e}")

    # 4. RAG retrieve
    rag_block = {"retrieved": [], "augmented_prompt_context": "", "retriever": ""}
    try:
        query = (req.keyword or "") + " " + (nlp_block["top_sentences"][0] if nlp_block["top_sentences"] else "")
        rag = rag_retrieve(query.strip(), top_k=3)
        rag_block = {
            "retrieved": rag.retrieved,
            "augmented_prompt_context": rag.augmented_prompt_context,
            "retriever": rag.retriever,
        }
    except Exception as e:  # noqa: BLE001
        print(f"[analyze] RAG failed: {e}")

    return {
        "ok": True,
        "nlp": nlp_block,
        "ml": ml_block,
        "deep_learning": dl_block,
        "rag": rag_block,
    }
