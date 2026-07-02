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
