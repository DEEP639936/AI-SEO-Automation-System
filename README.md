# SEOScout — AI-Powered SEO Automation System

An intelligent SaaS platform that automates the entire SEO workflow: **crawl & audit**, **AI content generation**, **keyword rank tracking**, and **automated reporting** — all in one animated, responsive dashboard.

Built on **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui + Framer Motion + Recharts + Prisma/SQLite**, with real AI via the **z-ai-web-dev-sdk**.

---

## ✨ Features

| Module | What it does |
| --- | --- |
| **Auth** | Email/password registration & login (scrypt hashing + signed httpOnly session cookie). Animated split-screen login/register page with inline validation, error-shake, password toggle, Google button, remember-me. |
| **Sites & Audits** | Add a website, trigger a **real HTTP crawl** (fetch + cheerio, robots.txt-aware, same-origin BFS). Detects broken links, missing/duplicate titles, missing meta descriptions, missing H1, missing alt text, slow loads, non-HTTPS, missing mobile viewport. Weighted 0–100 health score. Filterable issues table + audit history. |
| **Content Studio** | **Generate** full SEO drafts (title tag, meta description, H1, 300–500 word body, related keywords) or **Improve** existing copy for a target keyword — powered by real LLM calls. Before/after view with copy buttons. |
| **AI Recommendations** | Sends crawl findings to the AI and returns a plain-English summary + prioritized, actionable recommendations. |
| **Keywords & Rankings** | Add target keywords (auto-seeded with 14 days of history), view a multi-line ranking trend chart, per-keyword sparklines, position deltas, and "check now" to record fresh positions. |
| **Reports** | One-click weekly report bundling audit summary + keyword trends + top issues into a styled HTML report — viewable in-app and downloadable. |
| **Dashboard** | Overview with animated health-score ring, animated stat counters, ranking-trend chart, top issues, and the AI recommendations card. |
| **Content Intelligence** | A Python ML micro-service runs **NLP + Machine Learning + Deep Learning + RAG** analysis on generated content — surfacing an ML-predicted SEO score, a neural-network quality classification, readability metrics, extracted keywords, and retrieved SEO best-practice guidance. |

---

## 🧠 Python ML Backend (NLP · Machine Learning · Deep Learning · RAG)

A standalone **FastAPI** micro-service in `mini-services/seo-ml-service/` provides the
AI/ML capabilities that make this project resume-ready. It runs on port 8001 and is
called by the Next.js frontend through a server-side proxy.

### Tech stack
| Capability | Technology | Implementation |
| --- | --- | --- |
| **NLP** | Python + scikit-learn | TF-IDF keyword extraction, RAKE-style key-phrase extraction, Flesch-Kincaid readability, lexical diversity, extractive summarization (centroid cosine), passive-voice detection |
| **Machine Learning** | scikit-learn `RandomForestRegressor` | Trained on a synthetic 1,200-sample SEO dataset; predicts a 0–100 quality score from 6 engineered features; persisted with joblib; permutation-based feature attribution |
| **Deep Learning** | **NumPy from scratch** (no PyTorch/TensorFlow) | A 6→16→8→1 feedforward neural network with ReLU + sigmoid, binary cross-entropy loss, momentum-based gradient descent — forward prop, backprop, and training loop all hand-implemented. 95% test accuracy. Weights persisted as `.npy` |
| **RAG** | scikit-learn TF-IDF + cosine similarity | Retrieval-Augmented Generation: a 16-document SEO best-practices knowledge base, vectorized with TF-IDF (1-2 grams, sublinear tf); top-k retrieval returns relevant context injected into the LLM generation prompt |
| **API** | FastAPI + uvicorn | 5 endpoints: `/health`, `/nlp/analyze`, `/ml/score`, `/dl/classify`, `/rag/retrieve` |

### Run the ML service
```bash
cd mini-services/seo-ml-service
python3 -m app.train          # train ML + DL models (one-time)
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001   # start service
```

### Project structure
```
mini-services/seo-ml-service/
├── app/
│   ├── main.py              # FastAPI app + endpoints
│   ├── nlp.py               # NLP: keywords, readability, stats, summarization
│   ├── machine_learning.py  # scikit-learn RandomForest + feature engineering
│   ├── deep_learning.py     # NumPy MLP (from-scratch backprop)
│   ├── rag.py               # TF-IDF retrieval over SEO knowledge base
│   └── train.py             # model training entrypoint
├── weights/                 # persisted models (.joblib + .npy)
└── requirements.txt
```

### How it connects to the app
The Next.js Content Studio generates AI content, then the **Content Intelligence**
panel calls the Python service (via `/api/intelligence/analyze`) which runs all four
pipelines and returns a unified report: ML SEO score, DL quality classification,
NLP readability/keywords, and RAG-retrieved SEO guidance.

---

## 🚀 Run locally

```bash
bun install
bun run db:push     # create the SQLite schema
bun run dev         # http://localhost:3000
```

Open the app, register an account, add a site (e.g. `https://example.com`), and click **Crawl**.

> **Lint:** `bun run lint`

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── page.tsx                 # auth ↔ dashboard switch (single user route)
│   ├── layout.tsx               # providers + fonts + sticky-footer root
│   ├── globals.css              # electric-blue SaaS theme + utilities
│   └── api/                     # 20 route handlers (all server runtime)
│       ├── auth/{register,login,logout,me}
│       ├── sites/[id]/{crawl,audits,audit/latest,analyze,keywords,rankings}
│       ├── keywords/[id]/{check,rankings}
│       ├── content/{generate,improve,history}
│       └── reports/[id]
├── lib/
│   ├── auth.ts                  # scrypt + HMAC session tokens
│   ├── api.ts                   # response helpers + SSRF guard
│   ├── crawler.ts               # real SEO crawler (fetch + cheerio)
│   ├── ai.ts                    # z-ai-web-dev-sdk wrapper (generate/improve/analyze)
│   ├── ranking.ts               # ranking tracker + simulation + history seeding
│   ├── api-client.ts            # browser fetch wrapper
│   ├── store.ts                 # zustand UI state (view + selected site)
│   └── db.ts                    # Prisma client
├── hooks/use-api.ts             # all React Query hooks + shared types
└── components/
    ├── providers.tsx            # next-themes + react-query + toasters
    ├── auth/auth-screen.tsx
    ├── shared/                  # ScoreRing, AnimatedCounter, SeverityBadge, Markdown, EmptyState
    └── dashboard/               # shell, sidebar, 6 views
```

### Data model (Prisma / SQLite)
`User → Site → {Audit → AuditIssue, Keyword → KeywordRanking, Report}` + `ContentGeneration`. See `prisma/schema.prisma`.

---

## 🔌 Environment variables

All optional — the app runs without them. They unlock real third-party data when provided.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite path (default set in `.env`). |
| `SESSION_SECRET` | HMAC secret for session tokens (a dev default is used if unset). |
| `GSC_SERVICE_ACCOUNT_JSON` | Google Search Console service-account JSON → **live** keyword rankings. |
| `SEMRUSH_API_KEY` | SEMrush API key → alternative live ranking source. |
| `RESEND_API_KEY` | Resend key → email delivery of scheduled reports. |

> **AI:** content generation & audit analysis use the `z-ai-web-dev-sdk`, which is preconfigured in this environment — no key needed to use the app.

---

## ⚖️ Honest notes on real vs. simulated data

This project follows the principle: **never fake data silently**.

- ✅ **Crawls & audits** — 100% real. We fetch the live site with Node `fetch`, parse HTML with `cheerio`, respect `robots.txt`, and store genuine findings.
- ✅ **AI content & recommendations** — 100% real LLM output via `z-ai-web-dev-sdk`.
- ✅ **Reports** — built from your real audit + ranking data.
- 🟡 **Keyword rankings** — without a GSC/SEMrush key, positions come from a **deterministic, evolving simulation** so charts work end-to-end. The UI shows a clear "simulated" notice, and `lib/ranking.ts` documents the exact extension point for wiring a live API. Provide `GSC_SERVICE_ACCOUNT_JSON` or `SEMRUSH_API_KEY` to switch to live data.
- 🟡 **Email delivery** — reports are generated & stored for in-app viewing/download. Email send requires `RESEND_API_KEY`.
- 🟡 **Google OAuth** — the button is present; without OAuth client credentials it informs the user to use email sign-in (real OAuth requires `GOOGLE_OAUTH_CLIENT_ID/SECRET` + a callback flow).

---

## 🎨 UI/UX

- Mobile-first responsive (tested down to 375px; sidebar collapses to a slide-in sheet).
- Dark/light theme via `next-themes` (defaults to dark).
- Framer Motion: page transitions, staggered card entrances, animated counters, score-ring draw, nav active indicator (`layoutId`).
- Skeleton loaders, designed empty/error states, toast feedback (Sonner).
- Sticky footer that sits at the viewport bottom on short pages and is pushed down naturally on long pages.

---

## 🧭 Tech stack

Next.js 16 · TypeScript 5 · Tailwind CSS 4 · shadcn/ui (New York) · Radix UI · Framer Motion · Recharts · React Query · Zustand · Prisma 6 · SQLite · z-ai-web-dev-sdk · cheerio · next-themes · Sonner.

---

© SEOScout — built as a production-shaped reference for AI-powered SEO automation.
