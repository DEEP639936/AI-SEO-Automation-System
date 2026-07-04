"""
Retrieval-Augmented Generation (RAG) module.

Implements the RETRIEVAL half of RAG: given a query (e.g. a target keyword +
content context), retrieve the most relevant chunks from a curated SEO
best-practices knowledge base. The GENERATION half (LLM prompting with the
retrieved context) happens in the Next.js layer via z-ai-web-dev-sdk.

Retrieval uses TF-IDF vectorization + cosine similarity over a chunked
knowledge corpus — a classic, dependency-light IR approach. (Production
upgrades: swap TF-IDF for dense sentence-transformer embeddings + FAISS.)

The knowledge base is a curated set of SEO best-practice documents covering
title tags, meta descriptions, headings, content length, internal linking,
page speed, mobile, structured data, and keyword strategy.
"""
from __future__ import annotations

import os
import json
from dataclasses import dataclass
from typing import List, Dict, Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

CORPUS_PATH = os.path.join(os.path.dirname(__file__), "knowledge_base.json")


# ----------------------------------------------------------------- knowledge base

KNOWLEDGE_BASE: List[Dict[str, str]] = [
    {
        "id": "title-tag",
        "category": "On-Page",
        "title": "Optimize title tags for click-through and ranking",
        "content": (
            "Title tags are the single most important on-page SEO signal. Keep titles "
            "between 50 and 60 characters so they aren't truncated in search results. "
            "Place the primary keyword near the beginning of the title, and include your "
            "brand at the end for recognition. Each page should have a unique, descriptive "
            "title that accurately reflects the page content. Avoid keyword stuffing and "
            "duplicate titles across pages, which cannibalize rankings."
        ),
    },
    {
        "id": "meta-description",
        "category": "On-Page",
        "title": "Write compelling meta descriptions",
        "content": (
            "Meta descriptions don't directly affect rankings but strongly influence "
            "click-through rate. Aim for 150 to 155 characters. Include the primary "
            "keyword naturally, lead with a benefit, and end with a clear call to action. "
            "Write unique descriptions for every page. Treat the description as ad copy: "
            "it must earn the click from the search results page."
        ),
    },
    {
        "id": "headings",
        "category": "On-Page",
        "title": "Use a logical heading hierarchy",
        "content": (
            "Use exactly one H1 per page that includes the primary keyword or a close "
            "variant. Use H2 and H3 tags to create a clear content outline that both "
            "readers and search engines can scan. Headings should reflect the page's "
            "information architecture. Avoid skipping heading levels, and don't use "
            "headings purely for visual styling — use CSS for that."
        ),
    },
    {
        "id": "content-length",
        "category": "Content",
        "title": "Target comprehensive content depth",
        "content": (
            "Longer, comprehensive content tends to rank better for competitive terms, "
            "but only when it remains relevant and high quality. Aim for 800 to 1500 "
            "words for pillar pages and 300 to 600 words for supporting blog posts. "
            "Cover the topic exhaustively, answer related questions, and use examples. "
            "Thin content under 300 words rarely ranks. Quality always beats word count."
        ),
    },
    {
        "id": "keyword-density",
        "category": "Content",
        "title": "Maintain natural keyword usage",
        "content": (
            "Aim for a keyword density of roughly 1 to 2 percent — the primary keyword "
            "should appear naturally in the title, H1, first paragraph, and a few times "
            "in the body. Avoid keyword stuffing, which triggers spam signals. Use "
            "synonyms and related terms (LSI keywords) to build topical relevance without "
            "repetition. Read the content aloud; if it sounds robotic, reduce keyword usage."
        ),
    },
    {
        "id": "internal-linking",
        "category": "Technical",
        "title": "Build a strong internal linking structure",
        "content": (
            "Internal links distribute page authority and help search engines understand "
            "site structure. Link from high-authority pages to important target pages using "
            "descriptive anchor text that includes relevant keywords. Avoid generic anchors "
            "like 'click here'. Ensure every page is reachable within 3 clicks from the "
            "homepage. Use breadcrumb navigation and a logical URL structure."
        ),
    },
    {
        "id": "page-speed",
        "category": "Technical",
        "title": "Optimize Core Web Vitals and page speed",
        "content": (
            "Page speed is a confirmed ranking factor, especially for mobile. Target a "
            "Largest Contentful Paint under 2.5 seconds, First Input Delay under 100ms, "
            "and Cumulative Layout Shift under 0.1. Compress images, minify CSS and "
            "JavaScript, use a CDN, enable browser caching, and lazy-load below-the-fold "
            "media. Server response time should be under 200ms."
        ),
    },
    {
        "id": "mobile-friendly",
        "category": "Technical",
        "title": "Ensure mobile-friendliness",
        "content": (
            "Google uses mobile-first indexing, meaning the mobile version of your site "
            "is the primary version for ranking. Use a responsive design with a viewport "
            "meta tag, ensure tap targets are at least 48px, use legible font sizes "
            "(16px minimum body), and avoid interstitials that block content. Test with "
            "Google's Mobile-Friendly Test."
        ),
    },
    {
        "id": "structured-data",
        "category": "Technical",
        "title": "Implement structured data (schema.org)",
        "content": (
            "Structured data helps search engines understand your content and enables "
            "rich results. Implement schema.org JSON-LD for articles, products, FAQs, "
            "breadcrumbs, and organization info. Validate markup with Google's Rich "
            "Results Test. Structured data doesn't directly boost rankings but improves "
            "visibility through rich snippets, which increase click-through rate."
        ),
    },
    {
        "id": "keyword-research",
        "category": "Strategy",
        "title": "Build a keyword strategy with intent mapping",
        "content": (
            "Effective SEO starts with keyword research. Identify keywords by search "
            "volume, difficulty, and user intent (informational, navigational, "
            "transactional, commercial). Target long-tail keywords first — they have lower "
            "difficulty and higher conversion. Map each keyword to a specific page and "
            "intent stage. Use tools like Google Search Console, Ahrefs, or SEMrush to "
            "discover and prioritize opportunities."
        ),
    },
    {
        "id": "readability",
        "category": "Content",
        "title": "Write for readability and engagement",
        "content": (
            "Readable content keeps users on the page longer, which signals quality to "
            "search engines. Aim for a Flesch Reading Ease score of 60 or higher. Use "
            "short paragraphs (2-4 sentences), short sentences (15-20 words average), "
            "simple words, and active voice. Break up text with headings, bullet lists, "
            "and images. Front-load the most important information."
        ),
    },
    {
        "id": "backlinks",
        "category": "Off-Page",
        "title": "Earn high-quality backlinks",
        "content": (
            "Backlinks remain a top ranking factor, but quality matters far more than "
            "quantity. Earn links from authoritative, topically-relevant sites through "
            "original research, guest posting, digital PR, and linkable assets. Avoid "
            "buying links or participating in link schemes, which risk penalties. "
            "Monitor your backlink profile regularly and disavow toxic links."
        ),
    },
    {
        "id": "crawl-audit",
        "category": "Technical",
        "title": "Run regular technical SEO audits",
        "content": (
            "Crawl your site regularly to catch issues before they impact rankings. "
            "Check for broken links (4xx, 5xx), redirect chains, duplicate content, "
            "missing meta tags, orphaned pages, and crawl errors. Submit and maintain "
            "an XML sitemap. Monitor index coverage in Google Search Console. Fix "
            "critical issues within 48 hours of detection."
        ),
    },
    {
        "id": "content-freshness",
        "category": "Content",
        "title": "Update and refresh existing content",
        "content": (
            "Search engines favor fresh, up-to-date content. Regularly audit and update "
            "existing pages with new information, statistics, examples, and internal "
            "links. Republish updated content with a new date. Content decay is real — "
            "pages that ranked well can lose positions over time as competitors publish "
            "fresher takes. Prioritize updating pages that have slipped in rankings."
        ),
    },
    {
        "id": "ssl-https",
        "category": "Technical",
        "title": "Serve all pages over HTTPS",
        "content": (
            "HTTPS is a confirmed lightweight ranking signal and essential for user "
            "trust. Ensure every page is served over HTTPS with a valid SSL certificate. "
            "Redirect all HTTP URLs to HTTPS with a 301 redirect. Use HSTS headers to "
            "enforce HTTPS. Mixed content (HTTP resources on HTTPS pages) breaks "
            "security and should be eliminated."
        ),
    },
    {
        "id": "image-seo",
        "category": "On-Page",
        "title": "Optimize images for SEO and accessibility",
        "content": (
            "Every image needs descriptive alt text that includes relevant keywords "
            "where natural — this aids accessibility and image search. Compress images "
            "to reduce page weight, use modern formats (WebP, AVIF), and specify width "
            "and height to prevent layout shift. Use descriptive filenames. Lazy-load "
            "images below the fold."
        ),
    },
]


# ----------------------------------------------------------------- retriever

class SeoKnowledgeRetriever:
    """TF-IDF + cosine-similarity retriever over the SEO knowledge base."""

    def __init__(self) -> None:
        self.corpus = KNOWLEDGE_BASE
        self.texts = [f"{d['title']}. {d['content']} ({d['category']})" for d in self.corpus]
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            norm="l2",
            sublinear_tf=True,
        )
        self.doc_matrix = self.vectorizer.fit_transform(self.texts)

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        if not query or not query.strip():
            # Return a default diverse set.
            return [
                {**d, "score": 0.0, "rank": i + 1}
                for i, d in enumerate(self.corpus[:top_k])
            ]
        q_vec = self.vectorizer.transform([query])
        sims = cosine_similarity(q_vec, self.doc_matrix).ravel()
        top_idx = np.argsort(sims)[::-1][:top_k]
        results = []
        for rank, idx in enumerate(top_idx):
            doc = self.corpus[idx]
            results.append({
                "id": doc["id"],
                "category": doc["category"],
                "title": doc["title"],
                "content": doc["content"],
                "score": round(float(sims[idx]), 4),
                "rank": rank + 1,
            })
        return results


@dataclass
class RagResult:
    query: str
    retrieved: List[Dict[str, Any]]
    augmented_prompt_context: str  # ready to inject into an LLM prompt
    retriever: str  # description of the retrieval method


# Module-level singleton — fitting the TfidfVectorizer on every request is
# wasteful and can destabilize the worker under memory pressure.
_RETRIEVER: SeoKnowledgeRetriever | None = None


def _get_retriever() -> SeoKnowledgeRetriever:
    global _RETRIEVER
    if _RETRIEVER is None:
        _RETRIEVER = SeoKnowledgeRetriever()
    return _RETRIEVER


def retrieve(query: str, top_k: int = 3) -> RagResult:
    retriever = _get_retriever()
    docs = retriever.retrieve(query, top_k=top_k)
    # Build the context block to inject into the generation prompt.
    context_lines = []
    for d in docs:
        context_lines.append(
            f"[{d['rank']}] ({d['category']}) {d['title']}\n{d['content']}"
        )
    context = "\n\n".join(context_lines)
    return RagResult(
        query=query,
        retrieved=docs,
        augmented_prompt_context=context,
        retriever="TF-IDF (ngram 1-2, sublinear tf) + cosine similarity over 16-doc SEO knowledge base",
    )
