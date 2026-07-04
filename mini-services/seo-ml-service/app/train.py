"""
Standalone training entrypoint.

Trains both the scikit-learn ML model and the NumPy deep-learning network
on synthetic SEO data, then persists their weights so the FastAPI service
can load them at startup for fast inference.

Run:  python3 -m app.train   (or:  bun run train  in this service dir)
"""
from __future__ import annotations

import sys

from .machine_learning import train_model
from .deep_learning import SeoQualityNet, INPUT_DIM, H1, H2, OUTPUT_DIM
import numpy as np


def _generate_dl_dataset(n: int = 1500, seed: int = 21):
    """Generate synthetic labeled data for the binary quality classifier.
    Reuses the same feature->quality relationship as the ML module but
    produces a 0/1 label."""
    rng = np.random.default_rng(seed)
    X = rng.random((n, INPUT_DIM))
    # Underlying quality score 0..1 from weighted features
    weights = np.array([0.22, 0.18, 0.18, 0.14, 0.14, 0.14])
    quality = X @ weights
    # Label: high quality if quality > median + noise
    threshold = np.median(quality)
    noise = rng.normal(0, 0.03, n)
    y = ((quality + noise) > threshold).astype(np.float64).reshape(-1, 1)
    return X, y


def main() -> int:
    print("=" * 60)
    print("SEOScout ML/DL model training")
    print("=" * 60)

    print("\n[1/2] Training scikit-learn RandomForest (ML)...")
    ml_stats = train_model(verbose=True)
    print(f"      MAE={ml_stats['mae']:.2f}  R²={ml_stats['r2']:.3f}")

    print("\n[2/2] Training NumPy MLP (Deep Learning)...")
    X, y = _generate_dl_dataset(n=1500)
    # Split
    idx = np.random.default_rng(99).permutation(len(X))
    split = int(0.8 * len(X))
    X_tr, X_te = X[idx[:split]], X[idx[split:]]
    y_tr, y_te = y[idx[:split]], y[idx[split:]]

    net = SeoQualityNet(seed=42)
    history = net.train(X_tr, y_tr, epochs=500, lr=0.15, momentum=0.9, verbose=True)

    # Evaluate
    probs = net.predict_proba(X_te)
    preds = (probs >= 0.5).astype(int)
    acc = float(np.mean(preds == y_te.ravel().astype(int)))
    print(f"\n      DL test accuracy: {acc:.3f}  (final loss {history[-1]:.4f})")

    net.save()
    print("      Saved DL weights to app/../weights/")

    print("\n" + "=" * 60)
    print("Training complete. Models persisted.")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
