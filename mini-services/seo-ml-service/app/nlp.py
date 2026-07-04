"""
NLP utilities for SEO content analysis.

Implements classic natural-language-processing techniques:
  - Keyword extraction via TF-IDF over the document + a RAKE-style
    candidate phrase extractor.
  - Readability scoring (Flesch Reading Ease, Flesch-Kincaid Grade Level).
  - Text statistics (sentence/word counts, lexical diversity, avg word/
    sentence length, passive-voice heuristic).
All implemented with NumPy + scikit-learn — no heavy transformer deps.
"""
from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass, asdict
from typing import List, Dict, Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

# A small English stop-word list (keeps the service dependency-free).
_STOPWORDS = set(
    """a about above after again against all am an and any are aren't as at be
    because been before being below between both but by can't cannot could
    couldn't did didn't do does doesn't doing don't down during each few for
    from further had hadn't has hasn't have haven't having he he'd he'll he's
    her here here's hers herself him himself his how how's i i'd i'll i'm i've
    if in into is isn't it it's its itself let's me more most mustn't my myself
    no nor not of off on once only or other ought our ours ourselves out over
    own same shan't she she'd she'll she's should shouldn't so some such than
    that that's the their theirs them themselves then there there's these they
    they'd they'll they're they've this those through to too under until up very
    was wasn't we we'd we'll we're we've were weren't what what's when when's
    where where's which while who who's whom why why's with won't would wouldn't
    you you'd you'll you're you've your yours yourself yourselves""".split()
)

# RAKE candidate-word pattern: words, optional hyphen, length >= 3.
_WORD_RE = re.compile(r"[A-Za-z][A-Za-z'-]+")
_SENTENCE_RE = re.compile(r"[^.!?]+[.!?]|\S+$")
_PASSIVE_RE = re.compile(
    r"\b(?:is|are|was|were|be|been|being)\s+\w+(?:ed|en)\b", re.IGNORECASE
)
_VOWEL_GROUP_RE = re.compile(r"[aeiouy]+", re.IGNORECASE)


@dataclass
class TextStats:
    word_count: int
    sentence_count: int
    avg_words_per_sentence: float
    avg_word_length: float
    long_word_ratio: float  # fraction of words with > 3 syllables (complex)
    lexical_diversity: float  # type-token ratio
    passive_sentence_ratio: float
    reading_time_minutes: float


@dataclass
class Readability:
    flesch_reading_ease: float
    flesch_kincaid_grade: float
    interpretation: str


@dataclass
class NlpResult:
    keywords: List[Dict[str, Any]]  # [{keyword, score, count}]
    key_phrases: List[str]  # RAKE-style multi-word phrases
    text_stats: Dict[str, Any]
    readability: Dict[str, Any]
    top_sentences: List[str]  # extractive summary (highest-scoring sentences)


# ---------------------------------------------------------------- syllables

def _count_syllables(word: str) -> int:
    """Estimate syllable count using the vowel-group heuristic."""
    word = word.lower().strip(".,;:!?")
    if not word:
        return 0
    groups = _VOWEL_GROUP_RE.findall(word)
    count = len(groups)
    # Silent trailing 'e'
    if word.endswith("e") and count > 1:
        count -= 1
    return max(1, count)


# ---------------------------------------------------------------- analysis

def _split_sentences(text: str) -> List[str]:
    return [s.strip() for s in _SENTENCE_RE.findall(text) if s.strip()]


def _tokenize_words(text: str) -> List[str]:
    return _WORD_RE.findall(text)


def _extract_keywords_tfidf(text: str, top_k: int = 10) -> List[Dict[str, Any]]:
    """TF-IDF keyword extraction. We treat the document itself as the corpus
    is not available, so we compute term frequency weighted by a hand-tuned
    inverse-document-frequency approximation built from stop-words + length."""
    words = [w.lower() for w in _tokenize_words(text) if len(w) >= 3]
    if not words:
        return []

    counts = Counter(words)
    total = sum(counts.values())

    keywords: List[Dict[str, Any]] = []
    for word, count in counts.items():
        if word in _STOPWORDS:
            continue
        tf = count / total
        # Penalize very short / generic words as a proxy IDF.
        idf = math.log(1 + 4.0 / max(1, len(word) - 2))
        keywords.append({"keyword": word, "score": round(tf * idf, 4), "count": count})

    keywords.sort(key=lambda x: x["score"], reverse=True)
    return keywords[:top_k]


def _extract_key_phrases(text: str, top_k: int = 8) -> List[str]:
    """RAKE-inspired candidate phrase extraction: sequences of non-stopwords
    scored by member-degree + frequency."""
    words = _WORD_RE.findall(text)
    candidates: List[List[str]] = []
    current: List[str] = []
    for w in words:
        lw = w.lower()
        if lw in _STOPWORDS or len(lw) < 3:
            if len(current) >= 2:
                candidates.append(current)
            current = []
        else:
            current.append(w)
    if len(current) >= 2:
        candidates.append(current)

    # word frequency among candidate phrases
    freq: Dict[str, int] = Counter(w.lower() for ph in candidates for w in ph)
    # co-occurrence degree
    degree: Dict[str, int] = {}
    for ph in candidates:
        for w in ph:
            degree[w.lower()] = degree.get(w.lower(), 0) + len(ph)

    scored = []
    for ph in candidates:
        score = sum((degree.get(w.lower(), 0) + freq.get(w.lower(), 0))
                    for w in ph) / len(ph)
        scored.append((" ".join(ph), score))
    scored.sort(key=lambda x: x[1], reverse=True)
    # Deduplicate
    seen = set()
    out = []
    for phrase, _ in scored:
        key = phrase.lower()
        if key not in seen:
            seen.add(key)
            out.append(phrase)
        if len(out) >= top_k:
            break
    return out


def _compute_stats(text: str) -> TextStats:
    sentences = _split_sentences(text)
    words = _tokenize_words(text)
    n_words = len(words)
    n_sent = max(1, len(sentences))

    if n_words == 0:
        return TextStats(0, 0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)

    avg_wps = n_words / n_sent
    avg_wlen = sum(len(w) for w in words) / n_words

    syllable_counts = [_count_syllables(w) for w in words]
    complex_ratio = sum(1 for s in syllable_counts if s >= 3) / n_words

    lexical_diversity = len(set(w.lower() for w in words)) / n_words

    passive_count = sum(1 for s in sentences if _PASSIVE_RE.search(s))
    passive_ratio = passive_count / n_sent

    reading_time = n_words / 200.0  # ~200 wpm

    return TextStats(
        word_count=n_words,
        sentence_count=len(sentences),
        avg_words_per_sentence=round(avg_wps, 2),
        avg_word_length=round(avg_wlen, 2),
        long_word_ratio=round(complex_ratio, 3),
        lexical_diversity=round(lexical_diversity, 3),
        passive_sentence_ratio=round(passive_ratio, 3),
        reading_time_minutes=round(reading_time, 1),
    )


def _compute_readability(text: str) -> Readability:
    sentences = _split_sentences(text)
    words = _tokenize_words(text)
    n_words = len(words)
    n_sent = max(1, len(sentences))
    if n_words == 0:
        return Readability(0.0, 0.0, "No text")

    syllables = sum(_count_syllables(w) for w in words)
    asl = n_words / n_sent  # avg sentence length
    asw = syllables / n_words  # avg syllables per word

    flesch = 206.835 - 1.015 * asl - 84.6 * asw
    fk_grade = 0.39 * asl + 11.8 * asw - 15.59

    if flesch >= 90:
        interp = "Very easy — 5th grade"
    elif flesch >= 70:
        interp = "Easy — 6th–7th grade"
    elif flesch >= 60:
        interp = "Standard — 8th–9th grade"
    elif flesch >= 50:
        interp = "Fairly difficult — 10th–12th grade"
    elif flesch >= 30:
        interp = "Difficult — college"
    else:
        interp = "Very difficult — graduate"

    return Readability(
        flesch_reading_ease=round(flesch, 1),
        flesch_kincaid_grade=round(fk_grade, 1),
        interpretation=interp,
    )


def _extractive_summary(text: str, top_k: int = 3) -> List[str]:
    """Sentence scoring by TF-IDF cosine to the full document (centroid
    summarization). A classic extractive NLP technique."""
    sentences = _split_sentences(text)
    if len(sentences) <= top_k:
        return sentences
    if len(sentences) < 2:
        return sentences
    try:
        vect = TfidfVectorizer(stop_words="english", norm="l2")
        matrix = vect.fit_transform(sentences)
    except ValueError:
        # All-stopword or empty vocabulary — fall back to first sentences.
        return sentences[:top_k]

    # centroid: mean of all sentence vectors (dense)
    centroid = np.asarray(matrix.mean(axis=0))  # shape (1, n_features)
    from sklearn.metrics.pairwise import cosine_similarity
    sims = cosine_similarity(matrix, centroid).ravel()  # shape (n_sentences,)
    sims = np.asarray(sims).ravel()
    # Slight position bias toward earlier sentences (lead-bias).
    position_bias = np.linspace(1.0, 0.85, len(sentences))
    scores = sims * position_bias
    top_idx = np.argsort(scores)[::-1][:top_k]
    top_idx.sort()  # keep original order
    return [sentences[i] for i in top_idx]


def analyze_content(text: str, keyword: str | None = None, summarize: bool = True) -> NlpResult:
    """Run the full NLP pipeline on a piece of content.

    Set ``summarize=False`` to skip the extractive-summary step (which fits
    an extra TfidfVectorizer) — used by the combined /analyze endpoint to
    keep memory low.
    """
    if not text or not text.strip():
        return NlpResult(
            keywords=[],
            key_phrases=[],
            text_stats=asdict(_compute_stats("")),
            readability=asdict(_compute_readability("")),
            top_sentences=[],
        )

    keywords = _extract_keywords_tfidf(text, top_k=10)
    phrases = _extract_key_phrases(text, top_k=8)
    stats = _compute_stats(text)
    readability = _compute_readability(text)
    summary = _extractive_summary(text, top_k=3) if summarize else _split_sentences(text)[:3]

    # If a target keyword is provided, surface its density.
    if keyword:
        words = _tokenize_words(text)
        kw_lower = keyword.lower()
        kw_tokens = kw_lower.split()
        if len(kw_tokens) == 1:
            density = sum(1 for w in words if w.lower() == kw_lower) / max(1, len(words))
        else:
            # n-gram match for multi-word keyword
            lowered = [w.lower() for w in words]
            matches = 0
            for i in range(len(lowered) - len(kw_tokens) + 1):
                if lowered[i:i + len(kw_tokens)] == kw_tokens:
                    matches += 1
            density = matches / max(1, len(words))
        # Attach as a synthetic keyword entry for visibility.
        keywords.insert(0, {
            "keyword": keyword,
            "score": round(density, 4),
            "count": int(density * len(words)),
            "density": round(density * 100, 2),  # percentage
            "is_target": True,
        })

    return NlpResult(
        keywords=keywords,
        key_phrases=phrases,
        text_stats=asdict(stats),
        readability=asdict(readability),
        top_sentences=summary,
    )
