"use client";

/* =========================================================================
   SEOScout — Cinematic, scroll-driven marketing landing page
   Single self-contained component. Uses shared animation primitives + shadcn.
   ========================================================================= */

import { useRef, useState, type ReactNode } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  useTransform,
  useInView,
  type Variants,
} from "framer-motion";
import {
  Search,
  ArrowRight,
  Sparkles,
  Globe,
  TrendingUp,
  FileText,
  Gauge,
  CalendarClock,
  Check,
  Star,
  ScanSearch,
  ShieldCheck,
  Twitter,
  Github,
  Linkedin,
  Menu,
  X,
  ChevronDown,
  Bug,
  PenLine,
  BarChart3,
  Zap,
  Activity,
  Clock,
  ArrowUpRight,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuroraBackground } from "@/components/shared/aurora-background";
import { ParticleField } from "@/components/shared/particle-field";
import { ScrollProgress } from "@/components/shared/scroll-progress";
import { WordReveal } from "@/components/shared/word-reveal";
import { Parallax } from "@/components/shared/parallax";
import { SectionDivider } from "@/components/shared/section-divider";
import { CursorGlow } from "@/components/shared/cursor-glow";
import { TiltCard } from "@/components/shared/tilt-card";
import { MagneticButton } from "@/components/shared/magnetic-button";
import { Reveal, staggerContainer, staggerItem } from "@/components/shared/reveal";
import { Marquee } from "@/components/shared/marquee";
import { GlowCard } from "@/components/shared/glow-card";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Constants & data                                                   */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "Showcase", id: "showcase" },
  { label: "Pricing", id: "pricing" },
  { label: "FAQ", id: "faq" },
];

const COMPANIES = [
  "NorthPeak",
  "Lumenly",
  "Vantaco",
  "Polaris",
  "Nimbus",
  "Cobalt",
  "Quanta",
  "Helio",
  "Brightly",
  "Vault",
];

type Feature = {
  icon: typeof Globe;
  title: string;
  desc: string;
  span: string;
};

const FEATURES: Feature[] = [
  {
    icon: Globe,
    title: "Real site crawls",
    desc: "A depth-first crawler walks every internal link, parses your DOM with cheerio, and surfaces broken links, missing meta, alt text gaps, and duplicate titles — all in seconds.",
    span: "lg:col-span-2 lg:row-span-2",
  },
  {
    icon: PenLine,
    title: "AI content generation",
    desc: "Generate title tags, meta descriptions, and full H1-led articles tuned to your target keyword.",
    span: "lg:col-span-2",
  },
  {
    icon: TrendingUp,
    title: "Keyword rank tracking",
    desc: "Daily position tracking with 14-day history sparklines and delta indicators.",
    span: "",
  },
  {
    icon: FileText,
    title: "Automated reports",
    desc: "One-click branded HTML reports ready to ship to clients.",
    span: "",
  },
  {
    icon: Gauge,
    title: "Health scoring",
    desc: "A weighted 0–100 score turns every audit into a single shareable number.",
    span: "",
  },
  {
    icon: CalendarClock,
    title: "Scheduled audits",
    desc: "Weekly automated crawls keep your site honest without lifting a finger.",
    span: "lg:col-span-2",
  },
];

type Tab = {
  value: string;
  label: string;
  icon: typeof Bug;
  title: string;
  desc: string;
  bullets: string[];
};

const SHOWCASE_TABS: Tab[] = [
  {
    value: "audit",
    label: "Audit",
    icon: Bug,
    title: "Surface every issue in a single crawl",
    desc: "Every page is scored against 14 on-page SEO checks. Severity badges, deep links, and an AI-generated remediation plan make triage painless.",
    bullets: [
      "14 on-page SEO checks per page",
      "Critical / warning / info severity tags",
      "AI-prioritized remediation plan",
    ],
  },
  {
    value: "content",
    label: "Content Studio",
    icon: PenLine,
    title: "Generate SEO content that actually ranks",
    desc: "Title tags, meta descriptions, and full structured articles — all from a single keyword. Improve existing content with one click.",
    bullets: [
      "Title tags under 60 chars, meta under 155",
      "H1-led markdown with subheadings + bullets",
      "One-click improve existing content",
    ],
  },
  {
    value: "rankings",
    label: "Rankings",
    icon: BarChart3,
    title: "Track positions day by day",
    desc: "Daily rank tracking with multi-keyword trend lines and per-keyword sparklines. Watch your positions climb.",
    bullets: [
      "Daily position updates",
      "Multi-keyword trend overlay",
      "Per-keyword 14-day sparklines",
    ],
  },
  {
    value: "reports",
    label: "Reports",
    icon: FileText,
    title: "Ship branded reports in one click",
    desc: "Generate a complete, client-ready HTML report covering audits, rankings, and AI recommendations — downloadable in seconds.",
    bullets: [
      "Full HTML report with charts",
      "Top issues + keyword rankings included",
      "Download or email to clients",
    ],
  },
];

const STEPS = [
  {
    n: "01",
    icon: Globe,
    title: "Add your site",
    desc: "Drop in a URL. SEOScout immediately walks your domain, parses every page, and builds a complete inventory.",
  },
  {
    n: "02",
    icon: ScanSearch,
    title: "Run an audit",
    desc: "14 on-page checks run per page. AI analyzes the issue list and returns a prioritized remediation plan.",
  },
  {
    n: "03",
    icon: TrendingUp,
    title: "Track & ship reports",
    desc: "Track keyword positions daily, generate AI content, and ship branded reports to your clients in one click.",
  },
];

const LIVE_STATS = [
  { value: 4_200_000, label: "Pages crawled", format: (n: number) => `${(n / 1_000_000).toFixed(1)}M` },
  { value: 187_000, label: "Issues resolved", format: (n: number) => `${Math.round(n / 1000)}K` },
  { value: 99.98, label: "Uptime", format: (n: number) => `${n.toFixed(2)}%` },
  { value: 14, label: "Day free trial", format: (n: number) => `${Math.round(n)} days` },
];

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "SEOScout replaced three tools in our stack. The crawler alone catches issues our previous provider missed for months — and the AI recommendations are genuinely useful.",
    name: "Maya Chen",
    role: "Head of Growth, NorthPeak",
    initials: "MC",
  },
  {
    quote:
      "Our team went from spending a full day per client audit to under 20 minutes. The branded reports look polished enough to send straight to enterprise clients.",
    name: "Daniel Vargas",
    role: "SEO Lead, Lumenly",
    initials: "DV",
  },
  {
    quote:
      "The Content Studio is the real deal. We generate title tags and meta descriptions in bulk, and the AI content actually ranks. ROI in the first month.",
    name: "Priya Anand",
    role: "Founder, Cobalt Agency",
    initials: "PA",
  },
];

type Plan = {
  name: string;
  price: number;
  tagline: string;
  features: string[];
  cta: string;
  popular?: boolean;
};

const PRICING: Plan[] = [
  {
    name: "Starter",
    price: 29,
    tagline: "For solo founders & side projects",
    features: [
      "3 sites",
      "Weekly automated audits",
      "50 AI content generations / mo",
      "25 tracked keywords",
      "Email support",
    ],
    cta: "Start free",
  },
  {
    name: "Pro",
    price: 99,
    tagline: "For growing marketing teams",
    features: [
      "15 sites",
      "Daily automated audits",
      "Unlimited AI content generation",
      "250 tracked keywords",
      "Branded client reports",
      "Priority support",
    ],
    cta: "Start free",
    popular: true,
  },
  {
    name: "Business",
    price: 299,
    tagline: "For agencies & enterprises",
    features: [
      "Unlimited sites",
      "Hourly audit refreshes",
      "Dedicated AI compute",
      "Unlimited keywords",
      "White-label reports",
      "SSO + audit log",
    ],
    cta: "Start free",
  },
];

const FAQS = [
  {
    q: "How does the SEO crawler work?",
    a: "SEOScout runs a real BFS web crawl starting from your root URL. It follows same-origin links (respecting robots.txt), parses each page with cheerio, and runs 14 on-page checks — broken links, missing meta, alt text, H1 issues, mobile viewport, slow loads, and more. A weighted 0–100 health score is computed from the issue list.",
  },
  {
    q: "Is the AI content generation included in every plan?",
    a: "Yes. Every plan includes AI content generation powered by our in-house LLM. Starter includes 50 generations per month; Pro and above include unlimited. You can generate title tags, meta descriptions, full H1-led articles, and improve existing content with a single click.",
  },
  {
    q: "Where do keyword rankings come from?",
    a: "Out of the box, SEOScout uses a deterministic rank simulation with daily drift and 14-day historical seeding — perfect for demos and small teams. For production, plug in your Google Search Console or SEMrush API key in Settings and SEOScout will pull real, live positions automatically.",
  },
  {
    q: "Can I white-label reports for clients?",
    a: "Yes — Pro and Business plans include branded HTML reports. Business plans add full white-labeling (custom logo, colors, and sender domain) plus the ability to email reports directly to clients on a schedule.",
  },
  {
    q: "Do you offer a free trial?",
    a: "Every plan starts with a 14-day free trial. No credit card required. You can cancel any time inside the dashboard; we will never auto-charge you after the trial ends.",
  },
  {
    q: "Can I self-host or export my data?",
    a: "Your sites, audits, keywords, content, and reports are always exportable in JSON or CSV. SEOScout is a hosted SaaS — self-hosting is not currently offered, but you own your data and can take it with you at any time.",
  },
];

const FOOTER_LINKS = [
  {
    title: "Product",
    links: ["Features", "Showcase", "Pricing", "Changelog", "Roadmap"],
  },
  {
    title: "Resources",
    links: ["Documentation", "SEO Guide", "API Reference", "Status", "Blog"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Customers", "Contact", "Press kit"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Security", "DPA", "Sub-processors"],
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function scrollToId(id: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ------------------------------------------------------------------ */
/* Top navigation                                                     */
/* ------------------------------------------------------------------ */

function Nav({ onStart, onSignIn }: { onStart: () => void; onSignIn: () => void }) {
  const [shrunk, setShrunk] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setShrunk(v > 24));

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 sm:px-4"
    >
      <div
        className={cn(
          "mt-3 flex w-full max-w-6xl items-center justify-between gap-4 rounded-2xl px-3 transition-all duration-300 sm:px-4",
          shrunk ? "h-14 glass-panel glow-soft" : "h-16 bg-transparent"
        )}
      >
        {/* Brand */}
        <button
          onClick={() => scrollToId("top")}
          className="flex items-center gap-2.5"
          aria-label="SEOScout home"
        >
          <span className="grid size-8 place-items-center rounded-lg brand-gradient glow-primary">
            <Search className="size-4 text-white" />
          </span>
          <span className="text-base font-semibold tracking-tight">SEOScout</span>
        </button>

        {/* Center nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollToId(l.id)}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" onClick={onSignIn}>
            Sign in
          </Button>
          <MagneticButton
            as="button"
            onClick={onStart}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground glow-primary transition-colors hover:bg-primary/90"
          >
            Start free
            <ArrowRight className="size-3.5" />
          </MagneticButton>
        </div>

        {/* Mobile toggle */}
        <button
          className="grid size-9 place-items-center rounded-lg glass-panel md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-3 top-20 overflow-hidden rounded-2xl glass-panel p-2 md:hidden"
          >
            {NAV_LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  scrollToId(l.id);
                  setOpen(false);
                }}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </button>
            ))}
            <div className="mt-1 flex gap-2 border-t border-border/60 pt-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={onSignIn}>
                Sign in
              </Button>
              <Button
                size="sm"
                className="flex-1 glow-primary"
                onClick={() => {
                  onStart();
                  setOpen(false);
                }}
              >
                Start free
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero dashboard preview (floating mockup)                           */
/* ------------------------------------------------------------------ */

function ScoreRing({ score = 87 }: { score?: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  return (
    <svg viewBox="0 0 80 80" className="size-20">
      <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
      <motion.circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke="url(#scoreGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        transform="rotate(-90 40 40)"
      />
      <defs>
        <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.62 0.2 258)" />
          <stop offset="100%" stopColor="oklch(0.5 0.18 196)" />
        </linearGradient>
      </defs>
      <text x="40" y="44" textAnchor="middle" className="fill-foreground text-[15px] font-semibold">
        {score}
      </text>
    </svg>
  );
}

function HeroPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div ref={ref} className="relative">
      {/* soft glow under */}
      <div
        aria-hidden
        className="absolute -inset-x-10 -bottom-10 top-10 -z-10 rounded-[2rem] opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, color-mix(in oklch, var(--primary) 50%, transparent), transparent 70%)",
        }}
      />

      <TiltCard max={6} className="rounded-2xl">
        <div className="overflow-hidden rounded-2xl glass-panel glow-soft">
          {/* top bar */}
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
            <span className="size-2.5 rounded-full bg-chart-5/70" />
            <span className="size-2.5 rounded-full bg-chart-4/70" />
            <span className="size-2.5 rounded-full bg-chart-3/70" />
            <div className="ml-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="size-3" />
              app.seoscout.io/overview
            </div>
          </div>

          <div className="flex">
            {/* sidebar */}
            <aside className="hidden w-36 flex-col gap-1 border-r border-border/60 p-3 sm:flex">
              {[
                { icon: Gauge, label: "Overview", active: true },
                { icon: Bug, label: "Audits" },
                { icon: PenLine, label: "Content" },
                { icon: TrendingUp, label: "Keywords" },
                { icon: FileText, label: "Reports" },
              ].map((it, i) => (
                <motion.div
                  key={it.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                    it.active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  )}
                >
                  <it.icon className="size-3.5" />
                  {it.label}
                </motion.div>
              ))}
            </aside>

            {/* main */}
            <div className="flex-1 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Site health
                  </div>
                  <div className="text-sm font-medium">example.com</div>
                </div>
                <ScoreRing score={87} />
              </div>

              {/* stat cards */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { label: "Pages", value: "248", color: "text-chart-2" },
                  { label: "Issues", value: "12", color: "text-chart-5" },
                  { label: "Keywords", value: "86", color: "text-chart-3" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                    className="rounded-lg border border-border/60 bg-background/40 p-2.5"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                    <div className={cn("text-base font-semibold", s.color)}>{s.value}</div>
                  </motion.div>
                ))}
              </div>

              {/* area chart */}
              <div className="mt-3 rounded-lg border border-border/60 bg-background/40 p-3">
                <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>Ranking trend</span>
                  <span className="text-chart-3">+14 this week</span>
                </div>
                <svg viewBox="0 0 320 90" className="h-20 w-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.55 0.2 220)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="oklch(0.55 0.2 220)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <motion.path
                    d="M0 70 L40 64 L80 58 L120 60 L160 48 L200 42 L240 32 L280 28 L320 18 L320 90 L0 90 Z"
                    fill="url(#areaFill)"
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.8, delay: 0.9 }}
                  />
                  <motion.path
                    d="M0 70 L40 64 L80 58 L120 60 L160 48 L200 42 L240 32 L280 28 L320 18"
                    fill="none"
                    stroke="oklch(0.55 0.2 220)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={inView ? { pathLength: 1 } : {}}
                    transition={{ duration: 1.4, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <motion.circle
                    cx="320"
                    cy="18"
                    r="3"
                    fill="oklch(0.5 0.18 196)"
                    initial={{ scale: 0 }}
                    animate={inView ? { scale: 1 } : {}}
                    transition={{ delay: 1.9, type: "spring", stiffness: 300 }}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </TiltCard>

      {/* floating toast badges */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="animate-float absolute -left-4 top-24 hidden rounded-xl glass-panel glow-soft px-3 py-2 sm:flex md:-left-10"
      >
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-chart-5/15 text-chart-5">
            <Bug className="size-3.5" />
          </span>
          <div>
            <div className="text-xs font-medium">Issue detected</div>
            <div className="text-[10px] text-muted-foreground">Missing meta description</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20, y: -10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.7, duration: 0.5 }}
        className="animate-float-slow absolute -right-4 bottom-16 hidden rounded-xl glass-panel glow-soft px-3 py-2 sm:flex md:-right-10"
      >
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-chart-3/15 text-chart-3">
            <Check className="size-3.5" />
          </span>
          <div>
            <div className="text-xs font-medium">Content ready</div>
            <div className="text-[10px] text-muted-foreground">AI article generated</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section id="top" className="relative min-h-screen overflow-hidden pt-28 sm:pt-32">
      {/* particle field behind everything */}
      <div className="absolute inset-0 -z-0">
        <ParticleField density={70} />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-24 lg:grid-cols-2 lg:gap-8">
        {/* Left: copy */}
        <div className="relative z-10 flex flex-col items-start">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full glass-panel px-3 py-1 text-xs text-muted-foreground"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full brand-gradient" />
            </span>
            ✨ AI-Powered SEO Automation
          </motion.div>

          <WordReveal
            as="h1"
            text="Automate your SEO."
            className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
            stagger={0.06}
          />
          <WordReveal
            as="h1"
            text="Rank higher, faster."
            className="mt-2 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
            delay={0.2}
            stagger={0.06}
          />
          <span className="sr-only">Automate your SEO. Rank higher, faster.</span>
          {/* gradient version overlay (visible) */}
          <span
            aria-hidden
            className="mt-2 block text-4xl font-semibold leading-[1.05] tracking-tight brand-gradient-text gradient-pan sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            Rank higher, faster.
          </span>

          <Reveal delay={0.5} className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            SEOScout crawls your site, runs 14 on-page SEO checks, generates AI-tuned content,
            tracks keyword positions daily, and ships branded reports — all from one fast,
            beautiful dashboard.
          </Reveal>

          <Reveal delay={0.65} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <MagneticButton
              as="button"
              onClick={onStart}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground glow-primary transition-colors hover:bg-primary/90"
            >
              Start free
              <ArrowRight className="size-4" />
            </MagneticButton>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => scrollToId("showcase")}
              className="h-11 rounded-xl border border-border/60 glass-panel"
            >
              Watch demo
            </Button>
          </Reveal>

          {/* trust stats */}
          <Reveal delay={0.8} className="mt-10 grid w-full max-w-md grid-cols-3 gap-4">
            {[
              { v: 4200000, label: "Pages crawled", f: (n: number) => `${(n / 1_000_000).toFixed(1)}M` },
              { v: 187000, label: "Issues fixed", f: (n: number) => `${Math.round(n / 1000)}K` },
              { v: 99.98, label: "Uptime", f: (n: number) => `${n.toFixed(2)}%` },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-semibold text-glow sm:text-3xl">
                  <AnimatedCounter value={s.v} format={s.f} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </Reveal>
        </div>

        {/* Right: floating preview */}
        <Parallax offset={28} className="relative z-10">
          <div className="animate-float-slow">
            <HeroPreview />
          </div>
        </Parallax>
      </div>

      {/* scroll-down indicator */}
      <motion.button
        onClick={() => scrollToId("features")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-muted-foreground sm:flex"
        aria-label="Scroll to features"
      >
        <span className="text-[10px] uppercase tracking-widest">Scroll</span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="size-4" />
        </motion.span>
      </motion.button>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Trusted-by marquee                                                 */
/* ------------------------------------------------------------------ */

function TrustedBy() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <Reveal className="mb-6 text-center text-xs uppercase tracking-widest text-muted-foreground">
        Trusted by modern marketing teams
      </Reveal>
      <Reveal delay={0.1}>
        <Marquee>
          {COMPANIES.map((c) => (
            <span
              key={c}
              className="font-mono text-lg font-semibold text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              {c}
            </span>
          ))}
        </Marquee>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Features bento                                                     */
/* ------------------------------------------------------------------ */

function BarChartMini() {
  const bars = [
    { h: 28, color: "oklch(0.62 0.2 258)" },
    { h: 44, color: "oklch(0.55 0.2 220)" },
    { h: 36, color: "oklch(0.55 0.2 220)" },
    { h: 60, color: "oklch(0.5 0.18 196)" },
    { h: 72, color: "oklch(0.5 0.18 196)" },
    { h: 52, color: "oklch(0.55 0.2 220)" },
    { h: 84, color: "oklch(0.62 0.2 258)" },
    { h: 68, color: "oklch(0.5 0.18 196)" },
  ];
  return (
    <svg viewBox="0 0 240 110" className="h-32 w-full">
      {bars.map((b, i) => {
        const x = 10 + i * 28;
        const targetH = b.h;
        const y = 100 - targetH;
        return (
          <motion.rect
            key={i}
            x={x}
            width={18}
            rx={3}
            fill={b.color}
            initial={{ height: 0, y: 100 }}
            whileInView={{ height: targetH, y }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.7,
              delay: i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        );
      })}
      <line x1="0" y1="100" x2="240" y2="100" stroke="currentColor" strokeWidth="1" className="text-border" />
    </svg>
  );
}

function ScanningCard() {
  return (
    <div className="relative h-32 overflow-hidden rounded-lg border border-border/60 bg-background/40">
      <div className="absolute inset-0 grid-bg opacity-40" />
      {/* scan line */}
      <motion.div
        initial={{ x: "-100%" }}
        whileInView={{ x: "100%" }}
        viewport={{ once: true }}
        transition={{ duration: 2.2, ease: "easeInOut", delay: 0.3 }}
        className="absolute inset-y-0 w-1/3"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklch, var(--primary) 35%, transparent), transparent)",
        }}
      />
      <div className="relative flex h-full flex-col justify-center gap-2 px-4">
        {[80, 60, 70].map((w, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.2 }}
            className="h-2 rounded-full bg-foreground/15"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ f }: { f: Feature }) {
  return (
    <motion.div variants={staggerItem} className={cn("min-h-[160px]", f.span)}>
      <TiltCard max={5} className="h-full rounded-xl">
        <GlowCard className="flex h-full flex-col p-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg brand-gradient glow-primary">
              <f.icon className="size-4 text-white" />
            </span>
            <h3 className="text-base font-semibold">{f.title}</h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>

          {f.title === "Real site crawls" && (
            <div className="mt-4">
              <BarChartMini />
            </div>
          )}
          {f.title === "AI content generation" && <ScanningCard />}
          {f.title === "Scheduled audits" && (
            <div className="mt-4 flex items-center gap-1.5">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={cn(
                      "h-8 w-full rounded-md",
                      i === 2 ? "brand-gradient glow-primary" : "bg-foreground/8"
                    )}
                  />
                  <span className="text-[9px] text-muted-foreground">{d}</span>
                </div>
              ))}
            </div>
          )}
        </GlowCard>
      </TiltCard>
    </motion.div>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <Badge variant="outline" className="mb-4 glass-panel">
            Features
          </Badge>
        </Reveal>
        <WordReveal
          text="Everything you need to win search"
          className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
          stagger={0.05}
        />
        <Reveal delay={0.2} className="mt-4 text-muted-foreground">
          A complete SEO toolkit — crawl, audit, generate, track, and report — unified in one
          fast, beautiful workspace.
        </Reveal>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mt-12 grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} f={f} />
        ))}
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Showcase — tabbed product tour                                     */
/* ------------------------------------------------------------------ */

function AuditDemo() {
  const issues = [
    { sev: "Critical", label: "Broken link on /pricing", color: "bg-chart-5/15 text-chart-5" },
    { sev: "Warning", label: "Missing meta description", color: "bg-chart-4/15 text-chart-4" },
    { sev: "Warning", label: "Image missing alt text", color: "bg-chart-4/15 text-chart-4" },
    { sev: "Info", label: "Duplicate title tag", color: "bg-chart-2/15 text-chart-2" },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-[auto_1fr]">
      <div className="rounded-xl border border-border/60 bg-background/40 p-4">
        <ScoreRing score={72} />
        <div className="mt-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
          Health
        </div>
      </div>
      <div className="space-y-2">
        {issues.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.12, duration: 0.4 }}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2.5"
          >
            <div className="flex items-center gap-3">
              <Bug className="size-3.5 text-muted-foreground" />
              <span className="text-sm">{it.label}</span>
            </div>
            <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", it.color)}>
              {it.sev}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ContentDemo() {
  const lines = [
    "## How to Choose the Right Running Shoes",
    "",
    "Finding the perfect pair of running shoes starts with knowing your gait.",
    "Every runner lands differently — some overpronate, others supinate —",
    "and the right shoe corrects your natural biomechanics.",
    "",
    "### Key considerations",
    "- **Cushioning:** higher mileage = more stack height.",
    "- **Drop:** 8mm is the sweet spot for most recreational runners.",
  ];
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4 font-mono text-xs leading-relaxed">
      <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        <PenLine className="size-3" />
        AI Content Studio
      </div>
      {lines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.1, duration: 0.3 }}
          className={cn(line.startsWith("#") ? "font-semibold text-foreground" : "text-muted-foreground")}
        >
          {line || "\u00A0"}
        </motion.div>
      ))}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="inline-block h-3.5 w-1.5 bg-primary align-middle"
      />
    </div>
  );
}

function RankingsDemo() {
  const paths = [
    { d: "M0 80 L40 70 L80 75 L120 60 L160 50 L200 55 L240 38 L280 30 L320 22", stroke: "oklch(0.62 0.2 258)" },
    { d: "M0 60 L40 64 L80 55 L120 58 L160 45 L200 48 L240 40 L280 36 L320 28", stroke: "oklch(0.5 0.18 196)" },
    { d: "M0 90 L40 84 L80 80 L120 72 L160 68 L200 60 L240 58 L280 52 L320 48", stroke: "oklch(0.7 0.15 150)" },
  ];
  const rows = [
    { kw: "what is seo", pos: 4, chg: "+3", color: "text-chart-3" },
    { kw: "best running shoes", pos: 11, chg: "+6", color: "text-chart-3" },
    { kw: "seo audit tool", pos: 7, chg: "+2", color: "text-chart-3" },
    { kw: "keyword research", pos: 18, chg: "-1", color: "text-chart-5" },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-border/60 bg-background/40 p-3">
        <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          Multi-keyword trend
        </div>
        <svg viewBox="0 0 320 100" className="h-28 w-full" preserveAspectRatio="none">
          {paths.map((p, i) => (
            <motion.path
              key={i}
              d={p.d}
              fill="none"
              stroke={p.stroke}
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, delay: 0.2 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </svg>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background/40">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-border/60 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Keyword</span>
          <span>Pos</span>
          <span>7d</span>
        </div>
        {rows.map((r, i) => (
          <motion.div
            key={r.kw}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-border/40 px-3 py-2 text-xs last:border-b-0"
          >
            <span className="truncate">{r.kw}</span>
            <span className="font-medium">{r.pos}</span>
            <span className={cn("font-medium", r.color)}>{r.chg}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ReportsDemo() {
  const stats = [
    { label: "Pages audited", value: 248, color: "text-chart-2" },
    { label: "Issues found", value: 12, color: "text-chart-5" },
    { label: "Keywords tracked", value: 86, color: "text-chart-3" },
    { label: "Avg position", value: 14, color: "text-chart-1" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-border/60 bg-background/40 p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Monthly SEO Report
          </div>
          <div className="text-base font-semibold">example.com — November</div>
        </div>
        <Badge className="brand-gradient glow-primary">Ready</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="rounded-lg border border-border/60 p-3"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
            <div className={cn("text-xl font-semibold", s.color)}>
              <AnimatedCounter value={s.value} />
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-4 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary"
      >
        <Check className="size-3.5" />
        AI summary: site improved 23% month-over-month. Next priority: fix 3 missing meta descriptions.
      </motion.div>
    </motion.div>
  );
}

function Showcase() {
  const [active, setActive] = useState<string>("audit");
  const activeTab = SHOWCASE_TABS.find((t) => t.value === active) ?? SHOWCASE_TABS[0];

  return (
    <section id="showcase" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <Badge variant="outline" className="mb-4 glass-panel">
            Product tour
          </Badge>
        </Reveal>
        <WordReveal
          text="See SEOScout in action"
          className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
          stagger={0.05}
        />
        <Reveal delay={0.2} className="mt-4 text-muted-foreground">
          A live look at the four core surfaces — audit, content, rankings, and reports.
        </Reveal>
      </div>

      <Reveal delay={0.2} className="mt-10 flex justify-center">
        <Tabs value={active} onValueChange={setActive}>
          <TabsList className="h-auto flex-wrap gap-1 rounded-xl glass-panel p-1.5">
            {SHOWCASE_TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 data-[state=active]:glow-primary"
              >
                <t.icon className="size-3.5" />
                <span className="text-xs sm:text-sm">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Reveal>

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        {/* Left: copy */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab.value}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-lg brand-gradient glow-primary">
                  <activeTab.icon className="size-4 text-white" />
                </span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {activeTab.label}
                </span>
              </div>
              <WordReveal
                text={activeTab.title}
                className="text-2xl font-semibold tracking-tight sm:text-3xl"
                stagger={0.03}
              />
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {activeTab.desc}
              </p>
              <ul className="mt-6 space-y-2.5">
                {activeTab.bullets.map((b, i) => (
                  <motion.li
                    key={b}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="grid size-5 place-items-center rounded-full bg-primary/15 text-primary">
                      <Check className="size-3" />
                    </span>
                    {b}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: animated mock */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 rounded-3xl opacity-50 blur-3xl"
            style={{
              background:
                "radial-gradient(60% 60% at 60% 40%, color-mix(in oklch, var(--primary) 35%, transparent), transparent 70%)",
            }}
          />
          <TiltCard max={4} className="rounded-2xl">
            <div className="overflow-hidden rounded-2xl glass-panel glow-soft p-5">
              <div className="mb-4 flex items-center gap-2 border-b border-border/60 pb-3">
                <div className="flex gap-1.5">
                  <span className="size-2.5 rounded-full bg-chart-5/70" />
                  <span className="size-2.5 rounded-full bg-chart-4/70" />
                  <span className="size-2.5 rounded-full bg-chart-3/70" />
                </div>
                <span className="ml-2 text-xs text-muted-foreground">
                  app.seoscout.io/{activeTab.value}
                </span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  {active === "audit" && <AuditDemo />}
                  {active === "content" && <ContentDemo />}
                  {active === "rankings" && <RankingsDemo />}
                  {active === "reports" && <ReportsDemo />}
                </motion.div>
              </AnimatePresence>
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                       */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <Badge variant="outline" className="mb-4 glass-panel">
            How it works
          </Badge>
        </Reveal>
        <WordReveal
          text="From URL to ranked in three steps"
          className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
          stagger={0.05}
        />
      </div>

      <div ref={ref} className="relative mt-16">
        {/* connecting line (desktop) */}
        <svg
          className="absolute left-0 right-0 top-9 hidden h-1 w-full lg:block"
          viewBox="0 0 1000 4"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.62 0.2 258)" />
              <stop offset="50%" stopColor="oklch(0.5 0.18 196)" />
              <stop offset="100%" stopColor="oklch(0.62 0.2 258)" />
            </linearGradient>
          </defs>
          <motion.line
            x1="0"
            y1="2"
            x2="1000"
            y2="2"
            stroke="url(#lineGrad)"
            strokeWidth="2"
            strokeDasharray="1000"
            initial={{ strokeDashoffset: 1000 }}
            animate={inView ? { strokeDashoffset: 0 } : {}}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-10 lg:grid-cols-3"
        >
          {STEPS.map((s) => (
            <motion.div key={s.n} variants={staggerItem} className="relative flex flex-col items-center text-center">
              <Parallax offset={20} className="relative z-10">
                <div className="relative">
                  <div className="grid size-18 place-items-center rounded-full brand-gradient glow-primary">
                    <s.icon className="size-7 text-white" />
                  </div>
                  <span className="absolute -right-1 -top-1 grid size-7 place-items-center rounded-full border border-border bg-background text-xs font-semibold text-primary">
                    {s.n}
                  </span>
                </div>
              </Parallax>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Live stats band                                                    */
/* ------------------------------------------------------------------ */

function LiveStats() {
  return (
    <section className="px-4 py-20">
      <Parallax offset={40} className="mx-auto max-w-6xl">
        <div className="noise-overlay relative overflow-hidden rounded-3xl glass-panel glow-soft px-6 py-12 sm:px-12">
          <div className="absolute inset-0 dot-grid opacity-40" />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="relative grid grid-cols-2 gap-8 lg:grid-cols-4"
          >
            {LIVE_STATS.map((s) => (
              <motion.div key={s.label} variants={staggerItem} className="text-center">
                <div className="text-4xl font-semibold text-glow sm:text-5xl">
                  <AnimatedCounter value={s.value} format={s.format} />
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Parallax>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Testimonials                                                       */
/* ------------------------------------------------------------------ */

function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <Badge variant="outline" className="mb-4 glass-panel">
            Testimonials
          </Badge>
        </Reveal>
        <WordReveal
          text="Loved by modern SEO teams"
          className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
          stagger={0.05}
        />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mt-12 grid gap-5 md:grid-cols-3"
      >
        {TESTIMONIALS.map((t) => (
          <motion.div key={t.name} variants={staggerItem}>
            <GlowCard className="flex h-full flex-col p-6">
              <Quote className="size-6 text-primary/40" />
              <div className="mt-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-chart-4 text-chart-4" />
                ))}
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/90">
                "{t.quote}"
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                <span className="grid size-9 place-items-center rounded-full brand-gradient text-xs font-semibold text-white">
                  {t.initials}
                </span>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pricing                                                            */
/* ------------------------------------------------------------------ */

function Pricing({ onStart }: { onStart: () => void }) {
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <Badge variant="outline" className="mb-4 glass-panel">
            Pricing
          </Badge>
        </Reveal>
        <WordReveal
          text="Simple, transparent pricing"
          className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
          stagger={0.05}
        />
        <Reveal delay={0.2} className="mt-4 text-muted-foreground">
          Start free for 14 days. No credit card required. Cancel anytime.
        </Reveal>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mt-12 grid gap-5 lg:grid-cols-3 lg:items-center"
      >
        {PRICING.map((p) => (
          <motion.div
            key={p.name}
            variants={staggerItem}
            className={cn(p.popular && "lg:-my-2 lg:scale-105")}
          >
            <GlowCard
              className={cn(
                "relative flex h-full flex-col p-6",
                p.popular && "glow-primary conic-border"
              )}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="brand-gradient glow-primary">Most popular</Badge>
                </div>
              )}
              <div className="text-sm font-medium text-muted-foreground">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-semibold">${p.price}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{p.tagline}</p>

              <Separator className="my-5" />

              <ul className="flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span
                      className={cn(
                        "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full",
                        p.popular ? "bg-primary/15 text-primary" : "bg-foreground/10 text-foreground/70"
                      )}
                    >
                      <Check className="size-2.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <MagneticButton
                as="button"
                onClick={onStart}
                className={cn(
                  "mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors",
                  p.popular
                    ? "bg-primary text-primary-foreground glow-primary hover:bg-primary/90"
                    : "border border-border/60 glass-panel hover:bg-accent"
                )}
              >
                {p.cta}
                <ArrowRight className="size-3.5" />
              </MagneticButton>
            </GlowCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                */
/* ------------------------------------------------------------------ */

function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-20">
      <div className="text-center">
        <Reveal>
          <Badge variant="outline" className="mb-4 glass-panel">
            FAQ
          </Badge>
        </Reveal>
        <WordReveal
          text="Frequently asked questions"
          className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
          stagger={0.05}
        />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mt-10"
      >
        <Accordion type="single" collapsible className="glass-panel rounded-2xl px-5">
          {FAQS.map((f, i) => (
            <motion.div key={f.q} variants={staggerItem}>
              <AccordionItem value={`item-${i}`} className="border-border/60">
                <AccordionTrigger className="text-left text-base hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA                                                          */
/* ------------------------------------------------------------------ */

function FinalCTA({ onStart }: { onStart: () => void }) {
  return (
    <section className="px-4 py-20">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl glass-panel glow-soft">
        <div className="noise-overlay absolute inset-0" />
        {/* inner glow orbs */}
        <div
          aria-hidden
          className="absolute -left-20 -top-20 size-72 rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--primary) 50%, transparent), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -right-16 size-72 rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--chart-2) 45%, transparent), transparent 70%)",
          }}
        />

        <div className="relative px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="absolute inset-0 -z-0 opacity-60">
            <ParticleField density={30} />
          </div>

          <div className="relative">
            <Reveal>
              <Badge variant="outline" className="mb-5 glass-panel">
                <Sparkles className="size-3" />
                Get started
              </Badge>
            </Reveal>
            <WordReveal
              text="Ready to automate your SEO?"
              className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
              stagger={0.05}
            />
            <Reveal delay={0.3}>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
                Join thousands of marketing teams shipping better SEO with SEOScout. Start your
                14-day free trial — no credit card required.
              </p>
            </Reveal>
            <Reveal delay={0.45} className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <MagneticButton
                as="button"
                onClick={onStart}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-7 text-base font-medium text-primary-foreground glow-primary transition-colors hover:bg-primary/90"
              >
                Start free
                <ArrowRight className="size-4" />
              </MagneticButton>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Check className="size-3 text-chart-3" /> 14-day trial
                </span>
                <span className="inline-flex items-center gap-1">
                  <Check className="size-3 text-chart-3" /> No card
                </span>
                <span className="inline-flex items-center gap-1">
                  <Check className="size-3 text-chart-3" /> Cancel anytime
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                             */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="border-t border-border/60 px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          {/* Brand col */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg brand-gradient glow-primary">
                <Search className="size-4 text-white" />
              </span>
              <span className="text-base font-semibold">SEOScout</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              AI-powered SEO automation. Crawl, audit, generate, track, and report — from one
              beautiful dashboard.
            </p>
            <div className="mt-4 flex items-center gap-2">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid size-8 place-items-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="social"
                >
                  <Icon className="size-3.5" />
                </a>
              ))}
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-3 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-chart-3" />
              </span>
              All systems operational
            </div>
          </div>

          {/* Link cols */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.title}
              </div>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} SEOScout, Inc. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" /> Built for speed
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3" /> SOC 2 Type II
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap className="size-3" /> 99.98% uptime
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Main                                                               */
/* ------------------------------------------------------------------ */

export function LandingPage({
  onStart,
  onSignIn,
}: {
  onStart: () => void;
  onSignIn: () => void;
}) {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <ScrollProgress />
      <CursorGlow />
      <AuroraBackground />
      <Nav onStart={onStart} onSignIn={onSignIn} />
      <main>
        <Hero onStart={onStart} />
        <TrustedBy />
        <SectionDivider />
        <Features />
        <SectionDivider />
        <Showcase />
        <SectionDivider />
        <HowItWorks />
        <LiveStats />
        <Testimonials />
        <Pricing onStart={onStart} />
        <FAQ />
        <FinalCTA onStart={onStart} />
      </main>
      <Footer />
    </div>
  );
}
