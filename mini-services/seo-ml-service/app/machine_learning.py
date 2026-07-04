"""
Machine Learning module — scikit-learn RandomForest regressor that predicts
a continuous SEO quality score (0-100) from engineered content features.

A synthetic training dataset is generated programmatically with realistic
feature->score relationships (so the model learns meaningful patterns), the
model is trained and persisted with joblib, then loaded at inference time.

This is a complete ML lifecycle: feature engineering -> synthetic data
generation -> training -> evaluation -> persistence -> inference.
"""
from __future__ import annotations

import os
import random
from dataclasses import dataclass
from typing import Dict, Any, List

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

from .deep_learning import INPUT_DIM

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "weights", "ml_seo_model.joblib")
FEATURE_NAMES = [
    "word_count_norm",
    "keyword_density_norm",
    "readability_norm",
    "heading_count_norm",
    "lexical_diversity",
    "avg_sentence_len_norm",
]


@dataclass
class MLResult:
    predicted_score: float  # 0-100
    confidence_band: str  # Low / Medium / High
    feature_contributions: Dict[str, float]  # approximate SHAP-like via permutation
    model: str
    training_mae: float
    training_r2: float


# ----------------------------------------------------------------- features

def engineer_features(
    word_count: int,
    keyword_density: float,
    flesch: float,
    heading_count: int,
    lexical_diversity: float,
    avg_sentence_len: float,
) -> np.ndarray:
    """Convert raw content signals into the 6 normalized model features.
    Mirrors the normalization used by the deep-learning module."""
    return np.array([[
        min(word_count / 800.0, 1.0),
        min(keyword_density, 0.05) / 0.05 if keyword_density > 0 else 0.0,
        flesch / 100.0,
        min(heading_count / 8.0, 1.0),
        lexical_diversity,
        min(avg_sentence_len / 25.0, 1.0),
    ]], dtype=np.float64)


def features_from_dict(d: Dict[str, Any]) -> np.ndarray:
    return engineer_features(
        word_count=int(d.get("word_count", 0)),
        keyword_density=float(d.get("keyword_density", 0)),
        flesch=float(d.get("flesch_reading_ease", 50)),
        heading_count=int(d.get("heading_count", 0)),
        lexical_diversity=float(d.get("lexical_diversity", 0.5)),
        avg_sentence_len=float(d.get("avg_words_per_sentence", 15)),
    )


# ----------------------------------------------------------------- synthetic data

def _generate_synthetic_dataset(n: int = 1200, seed: int = 7) -> tuple[np.ndarray, np.ndarray]:
    """Generate a synthetic but realistic SEO-content dataset.

    The underlying scoring function rewards: 300-800 words, keyword density
    ~1.5-2.5%, readability 60-80, 3-6 headings, high lexical diversity, and
    12-20 word sentences. Noise is added so the model must generalize.
    """
    rng = random.Random(seed)
    X_rows: List[List[float]] = []
    y_vals: List[float] = []
    for _ in range(n):
        word_count = rng.randint(40, 1200)
        keyword_density = rng.uniform(0.0, 0.08)
        flesch = rng.uniform(10, 95)
        heading_count = rng.randint(0, 12)
        lexical_diversity = rng.uniform(0.2, 0.95)
        avg_sentence_len = rng.uniform(5, 40)

        # Ideal ranges
        wc_score = 1.0 - min(abs(word_count - 550) / 450.0, 1.0)
        kd_score = 1.0 - min(abs(keyword_density - 0.02) / 0.04, 1.0)
        rd_score = 1.0 - min(abs(flesch - 70) / 40.0, 1.0)
        hd_score = 1.0 - min(abs(heading_count - 4) / 6.0, 1.0)
        ld_score = lexical_diversity
        sl_score = 1.0 - min(abs(avg_sentence_len - 16) / 18.0, 1.0)

        # Weighted combination -> 0..100
        raw = (
            0.22 * wc_score + 0.18 * kd_score + 0.18 * rd_score
            + 0.14 * hd_score + 0.14 * ld_score + 0.14 * sl_score
        )
        score = raw * 100 + rng.gauss(0, 4.0)  # noise
        score = max(2.0, min(99.0, score))

        X_rows.append([
            min(word_count / 800.0, 1.0),
            min(keyword_density, 0.05) / 0.05 if keyword_density > 0 else 0.0,
            flesch / 100.0,
            min(heading_count / 8.0, 1.0),
            lexical_diversity,
            min(avg_sentence_len / 25.0, 1.0),
        ])
        y_vals.append(score)

    return np.array(X_rows, dtype=np.float64), np.array(y_vals, dtype=np.float64)


# ----------------------------------------------------------------- train/infer

def train_model(verbose: bool = True) -> dict:
    """Train the RandomForest on synthetic data, evaluate, persist."""
    X, y = _generate_synthetic_dataset(n=1200)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=11)

    model = RandomForestRegressor(
        n_estimators=40,
        max_depth=7,
        min_samples_leaf=5,
        random_state=11,
        n_jobs=1,
    )
    model.fit(X_tr, y_tr)

    preds = model.predict(X_te)
    mae = float(mean_absolute_error(y_te, preds))
    r2 = float(r2_score(y_te, preds))
    if verbose:
        print(f"[ml] RandomForest trained — MAE={mae:.2f}  R²={r2:.3f}")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump({"model": model, "mae": mae, "r2": r2}, MODEL_PATH)
    return {"mae": mae, "r2": r2, "n_train": len(X_tr), "n_test": len(X_te)}


def load_model():
    if not os.path.exists(MODEL_PATH):
        train_model(verbose=False)
    bundle = joblib.load(MODEL_PATH)
    return bundle["model"], bundle["mae"], bundle["r2"]


# Module-level cache so we don't joblib.load on every request (avoids
# thread/fork issues inside the uvicorn worker).
_CACHED: dict = {}


def get_cached_model():
    if not _CACHED:
        _CACHED["model"], _CACHED["mae"], _CACHED["r2"] = load_model()
    return _CACHED["model"], _CACHED["mae"], _CACHED["r2"]


def score_content(features: dict, with_contributions: bool = True) -> MLResult:
    # Load fresh each call and release immediately after — trades a little
    # latency for stable memory on RAM-constrained hosts.
    import gc
    model, mae, r2 = load_model()
    x = features_from_dict(features)
    score = float(model.predict(x)[0])
    score = max(0.0, min(100.0, score))

    contributions: Dict[str, float] = {}
    if with_contributions:
        baseline = score
        for i, name in enumerate(FEATURE_NAMES):
            x_perm = x.copy()
            x_perm[0, i] = 0.5
            delta = float(model.predict(x_perm)[0]) - baseline
            contributions[name] = round(delta, 2)

    # Release the model object so memory doesn't accumulate across calls.
    del model
    gc.collect()

    band = "High" if score >= 75 else "Medium" if score >= 50 else "Low"
    return MLResult(
        predicted_score=round(score, 1),
        confidence_band=band,
        feature_contributions=contributions,
        model=f"RandomForestRegressor(n_estimators=80, sklearn {__import__('sklearn').__version__})",
        training_mae=round(mae, 2),
        training_r2=round(r2, 3),
    )
