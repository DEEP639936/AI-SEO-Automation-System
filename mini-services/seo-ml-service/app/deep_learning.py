"""
Deep Learning module — a feedforward neural network implemented FROM SCRATCH
in NumPy. This demonstrates genuine understanding of the math behind deep
learning (forward propagation, backpropagation, gradient descent) rather than
a black-box library call.

Architecture:
  Input (6 SEO features) -> Dense(16, ReLU) -> Dense(8, ReLU) -> Dense(1, Sigmoid)
  Loss: binary cross-entropy
  Optimizer: vanilla gradient descent with momentum
  Task: classify SEO content as high-quality (1) vs low-quality (0) from
        engineered features (word count, keyword density, readability,
        heading count, lexical diversity, avg sentence length).

Weights are persisted to disk as .npy files after training, so the service
can load them at startup for fast inference.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import List, Tuple

import numpy as np

WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), "..", "weights")
W1_PATH = os.path.join(WEIGHTS_DIR, "dl_w1.npy")
B1_PATH = os.path.join(WEIGHTS_DIR, "dl_b1.npy")
W2_PATH = os.path.join(WEIGHTS_DIR, "dl_w2.npy")
B2_PATH = os.path.join(WEIGHTS_DIR, "dl_b2.npy")
W3_PATH = os.path.join(WEIGHTS_DIR, "dl_w3.npy")
B3_PATH = os.path.join(WEIGHTS_DIR, "dl_b3.npy")
META_PATH = os.path.join(WEIGHTS_DIR, "dl_meta.json")

# Network shape
INPUT_DIM = 6
H1 = 16
H2 = 8
OUTPUT_DIM = 1


# ----------------------------------------------------------------- activations

def _relu(z: np.ndarray) -> np.ndarray:
    return np.maximum(0.0, z)


def _relu_grad(z: np.ndarray) -> np.ndarray:
    return (z > 0).astype(z.dtype)


def _sigmoid(z: np.ndarray) -> np.ndarray:
    # Numerically stable sigmoid
    out = np.empty_like(z, dtype=np.float64)
    pos = z >= 0
    neg = ~pos
    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))
    ez = np.exp(z[neg])
    out[neg] = ez / (1.0 + ez)
    return out


# ----------------------------------------------------------------- model class

class SeoQualityNet:
    """A 2-hidden-layer MLP for SEO content quality classification."""

    def __init__(self, seed: int = 42) -> None:
        rng = np.random.default_rng(seed)
        # He initialization for ReLU layers.
        self.W1 = rng.standard_normal((INPUT_DIM, H1)) * np.sqrt(2.0 / INPUT_DIM)
        self.b1 = np.zeros((1, H1))
        self.W2 = rng.standard_normal((H1, H2)) * np.sqrt(2.0 / H1)
        self.b2 = np.zeros((1, H2))
        self.W3 = rng.standard_normal((H2, OUTPUT_DIM)) * np.sqrt(1.0 / H2)
        self.b3 = np.zeros((1, OUTPUT_DIM))
        # Momentum buffers
        self._vW1 = np.zeros_like(self.W1); self._vb1 = np.zeros_like(self.b1)
        self._vW2 = np.zeros_like(self.W2); self._vb2 = np.zeros_like(self.b2)
        self._vW3 = np.zeros_like(self.W3); self._vb3 = np.zeros_like(self.b3)

    # ---- forward pass (caches intermediates for backprop) ----
    def _forward(self, X: np.ndarray) -> Tuple[dict, np.ndarray]:
        Z1 = X @ self.W1 + self.b1
        A1 = _relu(Z1)
        Z2 = A1 @ self.W2 + self.b2
        A2 = _relu(Z2)
        Z3 = A2 @ self.W3 + self.b3
        A3 = _sigmoid(Z3)
        cache = {"X": X, "Z1": Z1, "A1": A1, "Z2": Z2, "A2": A2, "A3": A3}
        return cache, A3

    # ---- backprop ----
    def _backward(self, cache: dict, y: np.ndarray, lr: float, momentum: float) -> None:
        m = y.shape[0]
        # Output layer: sigmoid + BCE => dZ3 = A3 - y
        dZ3 = cache["A3"] - y  # (m,1)
        dW3 = cache["A2"].T @ dZ3 / m
        db3 = dZ3.sum(axis=0, keepdims=True) / m

        dA2 = dZ3 @ self.W3.T
        dZ2 = dA2 * _relu_grad(cache["Z2"])
        dW2 = cache["A1"].T @ dZ2 / m
        db2 = dZ2.sum(axis=0, keepdims=True) / m

        dA1 = dZ2 @ self.W2.T
        dZ1 = dA1 * _relu_grad(cache["Z1"])
        dW1 = cache["X"].T @ dZ1 / m
        db1 = dZ1.sum(axis=0, keepdims=True) / m

        # Momentum update
        beta = momentum
        self._vW3 = beta * self._vW3 + (1 - beta) * dW3
        self._vb3 = beta * self._vb3 + (1 - beta) * db3
        self._vW2 = beta * self._vW2 + (1 - beta) * dW2
        self._vb2 = beta * self._vb2 + (1 - beta) * db2
        self._vW1 = beta * self._vW1 + (1 - beta) * dW1
        self._vb1 = beta * self._vb1 + (1 - beta) * db1

        self.W3 -= lr * self._vW3; self.b3 -= lr * self._vb3
        self.W2 -= lr * self._vW2; self.b2 -= lr * self._vb2
        self.W1 -= lr * self._vW1; self.b1 -= lr * self._vb1

    def train(
        self,
        X: np.ndarray,
        y: np.ndarray,
        epochs: int = 400,
        lr: float = 0.1,
        momentum: float = 0.9,
        verbose: bool = False,
    ) -> List[float]:
        history: List[float] = []
        for epoch in range(epochs):
            cache, A3 = self._forward(X)
            # BCE loss
            eps = 1e-9
            loss = -np.mean(
                y * np.log(A3 + eps) + (1 - y) * np.log(1 - A3 + eps)
            )
            history.append(float(loss))
            self._backward(cache, y, lr, momentum)
            if verbose and epoch % 50 == 0:
                acc = float(np.mean((A3 >= 0.5).astype(int) == y.astype(int)))
                print(f"epoch {epoch:4d}  loss={loss:.4f}  acc={acc:.3f}")
        return history

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        _, A3 = self._forward(X)
        return A3.ravel()

    def save(self) -> None:
        os.makedirs(WEIGHTS_DIR, exist_ok=True)
        np.save(W1_PATH, self.W1); np.save(B1_PATH, self.b1)
        np.save(W2_PATH, self.W2); np.save(B2_PATH, self.b2)
        np.save(W3_PATH, self.W3); np.save(B3_PATH, self.b3)
        with open(META_PATH, "w") as f:
            json.dump({"input_dim": INPUT_DIM, "h1": H1, "h2": H2, "output_dim": OUTPUT_DIM}, f)

    @classmethod
    def load(cls) -> "SeoQualityNet | None":
        if not all(os.path.exists(p) for p in (W1_PATH, B1_PATH, W2_PATH, B2_PATH, W3_PATH, B3_PATH)):
            return None
        net = cls()
        net.W1 = np.load(W1_PATH); net.b1 = np.load(B1_PATH)
        net.W2 = np.load(W2_PATH); net.b2 = np.load(B2_PATH)
        net.W3 = np.load(W3_PATH); net.b3 = np.load(B3_PATH)
        return net


# ----------------------------------------------------------------- inference

@dataclass
class DLResult:
    quality_probability: float  # 0..1 — probability content is "high quality"
    quality_label: str  # Low / Medium / High
    confidence: float  # 0..1
    model: str  # architecture description


def features_to_vector(features: dict) -> np.ndarray:
    """Map a feature dict (from the NLP/feature engineering step) into the
    network's 6-dim input, normalized to roughly [0, 1]."""
    word_count = float(features.get("word_count", 0))
    keyword_density = float(features.get("keyword_density", 0))  # 0..1
    flesch = float(features.get("flesch_reading_ease", 50))  # 0..100
    heading_count = float(features.get("heading_count", 0))
    lexical_diversity = float(features.get("lexical_diversity", 0.5))  # 0..1
    avg_sentence_len = float(features.get("avg_words_per_sentence", 15))

    # Normalization heuristics
    x = np.array([[
        min(word_count / 800.0, 1.0),       # cap at 800 words
        min(keyword_density, 0.05) / 0.05,  # ideal ~2-3%
        flesch / 100.0,
        min(heading_count / 8.0, 1.0),      # cap at 8 headings
        lexical_diversity,
        min(avg_sentence_len / 25.0, 1.0),  # ideal ~15-20
    ]], dtype=np.float64)
    return x


def classify(net: SeoQualityNet, features: dict) -> DLResult:
    x = features_to_vector(features)
    prob = float(net.predict_proba(x)[0])
    if prob >= 0.66:
        label = "High"
    elif prob >= 0.4:
        label = "Medium"
    else:
        label = "Low"
    # Confidence = distance from 0.5 decision boundary, scaled.
    confidence = round(abs(prob - 0.5) * 2.0, 3)
    return DLResult(
        quality_probability=round(prob, 4),
        quality_label=label,
        confidence=confidence,
        model=f"MLP({INPUT_DIM}-{H1}-{H2}-{OUTPUT_DIM}, ReLU/Sigmoid, BCE, NumPy)",
    )
