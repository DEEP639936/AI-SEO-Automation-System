"use client";

/* =========================================================================
   SEOScout — Premium marketing landing page
   Single self-contained component. Uses shared animation primitives + shadcn.
   ========================================================================= */

import { useRef, useState, type ReactNode } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
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
  Zap,
  Shield,
  Twitter,
  Github,
  Linkedin,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Bug,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AuroraBackground } from "@/components/shared/aurora-background";
import { TiltCard } from "@/components/shared/tilt-card";
import { MagneticButton } from "@/components/shared/magnetic-button";
import { Reveal, staggerContainer, staggerItem } from "@/components/shared/reveal";
import { Marquee } from "@/components/shared/marquee";
import { GlowCard } from "@/components/shared/glow-card";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "How it works", id: "how" },
  { label: "Pricing", id: "pricing" },
];

const COMPANIES = [
  "Northwind",
  "Quanta Labs",
  "Vertex Media",
  "Lumen",
  "Brightpath",
  "Cobalt",
  "Foundry",
  "Helix",
  "Orbital",
  "Meridian",
];

type Feature = {
  icon: LucideIcon;
  title: string;
  desc: string;
  accent: string; // chart color token name
};

const FEATURES: Feature[] = [
  {
    icon: Globe,
    title: "Real site crawls",
    desc: "Our bot walks every page on your site the way Google does — following links, reading robots.txt, and surfacing broken links, missing meta, slow loads, and duplicate titles in seconds.",
    accent: "chart-1",
  },
  {
    icon: Sparkles,
    title: "AI content generation",
    desc: "Generate optimized titles, meta descriptions, H1s and full article drafts in under 60 seconds — tuned to your keyword and tone.",
    accent: "chart-2",
  },
  {
    icon: TrendingUp,
    title: "Keyword rank tracking",
    desc: "Daily position updates with 14-day trends, sparklines, and change deltas so you always know which way the needle is moving.",
    accent: "chart-3",
  },
  {
    icon: FileText,
    title: "Automated reports",
    desc: "Beautiful, shareable HTML reports generated on a schedule. Stakeholders stay informed without you lifting a finger.",
    accent: "chart-4",
  },
  {
    icon: Gauge,
    title: "Health scoring",
    desc: "A single weighted score from 0–100 that combines critical, warning, and info issues into one number your team can rally around.",
    accent: "chart-1",
  },
  {
    icon: CalendarClock,
    title: "Scheduled audits",
    desc: "Set it and forget it. Hourly, daily, or weekly audits run automatically and alert you the moment a regression slips in.",
    accent: "chart-2",
  },
];

const STEPS = [
  {
    icon: ScanSearch,
    title: "Add your site",
    desc: "Drop in your URL. SEOScout reads your robots.txt, maps every internal link, and queues your pages for a full crawl in under a second.",
  },
  {
    icon: Bug,
    title: "We crawl & analyze",
    desc: "Every page is fetched, parsed, and scored. Broken links, missing meta, slow loads, duplicate titles, mobile issues — all caught automatically.",
  },
  {
    icon: Zap,
    title: "Generate, fix & track",
    desc: "Spin up AI content, ship fixes, then watch your keyword rankings climb with daily updates and trended reports your stakeholders will actually read.",
  },
];

const LIVE_STATS = [
  { value: 10420, suffix: "+", label: "Sites audited" },
  { value: 2140000, suffix: "+", label: "Issues fixed" },
  { value: 184500, suffix: "+", label: "AI generations" },
  { value: 38, prefix: "+", suffix: "%", label: "Avg score uplift" },
];

const TESTIMONIALS = [
  {
    quote:
      "SEOScout replaced three tools for us. The AI content generation alone saves our team eight hours a week. Rankings climbed 40% in the first quarter.",
    name: "Maya Chen",
    role: "Head of Growth, Northwind",
    initials: "MC",
  },
  {
    quote:
      "We finally have one source of truth for technical SEO. The automated crawls catch issues before Google does. It paid for itself in week one.",
    name: "Daniel Okafor",
    role: "SEO Lead, Quanta Labs",
    initials: "DO",
  },
  {
    quote:
      "The weekly reports are gorgeous and the rank tracking is scary accurate. Our clients think we hired an extra analyst. It's just SEOScout.",
    name: "Priya Nair",
    role: "Founder, Brightpath Studio",
    initials: "PN",
  },
];

type Plan = {
  name: string;
  price: number;
  tagline: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    price: 29,
    tagline: "For solo founders & side projects",
    features: [
      "3 sites",
      "50 AI generations / mo",
      "Weekly automated audits",
      "50 tracked keywords",
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
      "500 AI generations / mo",
      "Daily automated audits",
      "500 tracked keywords",
      "Automated weekly reports",
      "Priority support",
    ],
    cta: "Start free",
    highlighted: true,
  },
  {
    name: "Business",
    price: 299,
    tagline: "For agencies & in-house teams",
    features: [
      "Unlimited sites",
      "Unlimited AI generations",
      "Hourly audits",
      "5,000 tracked keywords",
      "White-label reports",
      "Dedicated manager + SSO",
    ],
    cta: "Start free",
  },
];

const FOOTER_COLS = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Changelog", "Roadmap"],
  },
  {
    title: "Resources",
    links: ["Documentation", "API Reference", "Blog", "Status"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Press", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Security", "DPA"],
  },
];

/* ------------------------------------------------------------------ */
/* Animation variants                                                 */
/* ------------------------------------------------------------------ */

const heroContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};
const heroItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
  },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function scrollToId(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function GradientIcon({ icon: Icon, accent }: { icon: LucideIcon; accent: string }) {
  return (
    <div
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-xl brand-gradient text-white shadow-lg shadow-primary/20"
      )}
    >
      <Icon className="h-5 w-5" data-accent={accent} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Score ring (SVG)                                                   */
/* ------------------------------------------------------------------ */

function ScoreRing({ value = 92, size = 132 }: { value?: number; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/40"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold tracking-tight"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {value}
        </motion.span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Health
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Line chart (SVG)                                                   */
/* ------------------------------------------------------------------ */

function TrendChart() {
  return (
    <svg
      viewBox="0 0 300 100"
      preserveAspectRatio="none"
      className="h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M 0 80 C 30 75, 50 70, 70 62 S 110 48, 140 52 S 180 32, 210 26 S 260 14, 300 8 L 300 100 L 0 100 Z"
        fill="url(#areaGrad)"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.8 }}
      />
      <motion.path
        d="M 0 80 C 30 75, 50 70, 70 62 S 110 48, 140 52 S 180 32, 210 26 S 260 14, 300 8"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
      />
      <motion.circle
        cx="300"
        cy="8"
        r="3.5"
        fill="#06b6d4"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.7, type: "spring", stiffness: 300, damping: 15 }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Animated bar chart (for large feature card)                        */
/* ------------------------------------------------------------------ */

function BarChartMini() {
  const bars = [38, 62, 48, 78, 68, 92, 84];
  return (
    <div className="flex h-24 items-end gap-2">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-t-md brand-gradient opacity-90"
          initial={{ height: 0 }}
          whileInView={{ height: `${h}%` }}
          viewport={{ once: true }}
          transition={{
            duration: 0.8,
            delay: i * 0.09,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard preview (centerpiece)                                    */
/* ------------------------------------------------------------------ */

function DashboardPreview() {
  return (
    <div className="glass-panel relative overflow-hidden rounded-2xl border-border/60 shadow-2xl shadow-primary/10">
      {/* top chrome */}
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </div>
        <div className="ml-3 flex h-6 flex-1 items-center rounded-md bg-muted/50 px-3 text-[10px] font-mono text-muted-foreground">
          app.seoscout.ai/overview
        </div>
      </div>

      {/* body */}
      <div className="grid grid-cols-[56px_1fr] sm:grid-cols-[140px_1fr]">
        {/* sidebar */}
        <aside className="hidden flex-col gap-1 border-r border-border/60 p-3 sm:flex">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md brand-gradient">
              <Search className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[11px] font-semibold">SEOScout</span>
          </div>
          {[
            { icon: LayoutDashboard, label: "Overview", active: true },
            { icon: Globe, label: "Sites" },
            { icon: Bug, label: "Issues" },
            { icon: TrendingUp, label: "Keywords" },
            { icon: FileText, label: "Reports" },
          ].map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px]",
                item.active
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{item.label}</span>
            </div>
          ))}
        </aside>

        {/* main */}
        <div className="space-y-3 p-3 sm:p-4">
          {/* top stat row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <PreviewStat label="Health" value="92" delta="+6" tone="up" />
            <PreviewStat label="Issues" value="14" delta="-23" tone="up" />
            <PreviewStat label="Keywords" value="128" delta="+12" tone="up" />
          </div>

          {/* chart + ring */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_132px]">
            <div className="rounded-lg border border-border/60 bg-card/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Organic traffic
                </span>
                <Badge
                  variant="secondary"
                  className="h-5 px-1.5 text-[10px] text-emerald-500"
                >
                  <TrendingUp className="h-3 w-3" /> +38%
                </Badge>
              </div>
              <div className="h-20">
                <TrendChart />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-border/60 bg-card/60 p-3">
              <ScoreRing value={92} size={104} />
            </div>
          </div>

          {/* issues list */}
          <div className="rounded-lg border border-border/60 bg-card/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground">
                Top issues
              </span>
              <span className="text-[10px] text-muted-foreground">4 active</span>
            </div>
            <div className="space-y-1.5">
              {[
                { sev: "critical", label: "Missing meta description", pages: "/blog/*" },
                { sev: "warning", label: "Slow page load", pages: "/pricing" },
                { sev: "warning", label: "Image missing alt", pages: "/team" },
              ].map((issue) => (
                <div
                  key={issue.label}
                  className="flex items-center gap-2 text-[11px]"
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      issue.sev === "critical" ? "bg-red-400" : "bg-amber-400"
                    )}
                  />
                  <span className="flex-1 truncate text-foreground/80">
                    {issue.label}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {issue.pages}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewStat({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "up" | "down";
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-2.5 sm:p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold sm:text-xl">{value}</div>
      <div
        className={cn(
          "text-[10px] font-medium",
          tone === "up" ? "text-emerald-500" : "text-red-400"
        )}
      >
        {delta}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading                                                    */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: ReactNode;
  desc: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Reveal>
        <Badge
          variant="secondary"
          className="mb-4 rounded-full border-primary/20 bg-primary/10 px-3 text-[11px] font-medium uppercase tracking-wider text-primary"
        >
          {eyebrow}
        </Badge>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {title}
        </h2>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
          {desc}
        </p>
      </Reveal>
    </div>
  );
}

/* ================================================================== */
/* MAIN COMPONENT                                                     */
/* ================================================================== */

export function LandingPage({
  onStart,
  onSignIn,
}: {
  onStart: () => void;
  onSignIn: () => void;
}) {
  const { scrollY, scrollYProgress } = useScroll();
  const [navHidden, setNavHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const prevY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = prevY.current;
    prevY.current = latest;
    if (latest > prev && latest > 120) setNavHidden(true);
    else setNavHidden(false);
  });

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <AuroraBackground />

      {/* scroll progress */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left brand-gradient"
        aria-hidden
      />

      {/* ============ NAV ============ */}
      <motion.header
        animate={{ y: navHidden ? -120 : 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-50 px-3 pt-3 sm:px-5"
      >
        <div className="glass-panel mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 py-2.5 sm:px-5">
          {/* logo */}
          <button
            type="button"
            onClick={() => scrollToId("top")}
            className="flex items-center gap-2.5"
            aria-label="SEOScout home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white shadow-md shadow-primary/30">
              <Search className="h-4.5 w-4.5" />
            </div>
            <span className="text-base font-semibold tracking-tight">
              SEO<span className="text-primary">Scout</span>
            </span>
          </button>

          {/* center links */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToId(link.id)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* right actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignIn}
              className="hidden sm:inline-flex"
            >
              Sign in
            </Button>
            <MagneticButton
              as="button"
              onClick={onStart}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </MagneticButton>
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* mobile dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="glass-panel mx-auto mt-2 max-w-6xl rounded-2xl p-2 md:hidden"
            >
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => {
                    scrollToId(link.id);
                    setMobileOpen(false);
                  }}
                  className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {link.label}
                </button>
              ))}
              <Separator className="my-1" />
              <button
                type="button"
                onClick={() => {
                  onSignIn();
                  setMobileOpen(false);
                }}
                className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium hover:bg-accent"
              >
                Sign in
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ============ HERO ============ */}
      <section
        id="top"
        className="relative mx-auto flex max-w-6xl flex-col items-center px-5 pb-20 pt-16 text-center sm:pt-24 md:pb-28 md:pt-28"
      >
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center"
        >
          {/* pill */}
          <motion.div variants={heroItem}>
            <div className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              ✨ AI-Powered SEO Automation
            </div>
          </motion.div>

          {/* headline */}
          <motion.h1
            variants={heroItem}
            className="mt-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Automate your SEO.
            <br />
            <span className="brand-gradient-text gradient-pan">
              Rank higher, faster.
            </span>
          </motion.h1>

          {/* subhead */}
          <motion.p
            variants={heroItem}
            className="mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg"
          >
            SEOScout crawls your site, audits every page, generates AI content,
            and tracks keyword rankings — so you can ship SEO wins while you
            sleep.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={heroItem}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
          >
            <MagneticButton
              as="button"
              onClick={onStart}
              className="glow-primary inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </MagneticButton>
            <button
              type="button"
              onClick={() => scrollToId("how")}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card/40 px-6 text-sm font-medium backdrop-blur transition-colors hover:bg-accent"
            >
              See how it works
              <ChevronDown className="h-4 w-4" />
            </button>
          </motion.div>

          {/* mini trust stats */}
          <motion.div
            variants={heroItem}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12"
          >
            <HeroStat value={10000} suffix="+" label="sites audited" />
            <span className="hidden h-8 w-px bg-border sm:block" />
            <HeroStat value={2000000} suffix="+" label="issues fixed" />
            <span className="hidden h-8 w-px bg-border sm:block" />
            <HeroStat value={60} prefix="<" suffix="s" label="AI content" />
          </motion.div>
        </motion.div>

        {/* floating dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="perspective-1000 relative mt-16 w-full max-w-5xl"
        >
          {/* glow under */}
          <div
            aria-hidden
            className="absolute -inset-x-8 -bottom-6 top-10 -z-10 rounded-[3rem] bg-primary/20 blur-3xl"
          />
          <div className="animate-float-slow">
            <TiltCard max={6} className="rounded-2xl">
              <DashboardPreview />
            </TiltCard>
          </div>
        </motion.div>
      </section>

      {/* ============ TRUSTED BY MARQUEE ============ */}
      <section className="relative py-12">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Trusted by teams at
          </p>
          <div className="relative mt-6">
            <Marquee>
              {COMPANIES.map((name) => (
                <span
                  key={name}
                  className="select-none whitespace-nowrap font-mono text-lg font-semibold tracking-tight text-muted-foreground/70 transition-colors hover:text-foreground sm:text-xl"
                >
                  {name}
                </span>
              ))}
            </Marquee>
          </div>
        </div>
      </section>

      {/* ============ FEATURES BENTO ============ */}
      <section id="features" className="relative scroll-mt-24 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="Features"
            title={
              <>
                Everything you need to{" "}
                <span className="brand-gradient-text">win at SEO</span>
              </>
            }
            desc="One platform that replaces your crawler, your content tools, your rank tracker, and your reporting spreadsheet."
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {/* Large card 1 — Real site crawls (2x2) */}
            <motion.div
              variants={staggerItem}
              className="sm:col-span-2 lg:col-span-2 lg:row-span-2"
            >
              <TiltCard max={5} className="h-full rounded-2xl">
                <GlowCard className="flex h-full flex-col gap-4 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <GradientIcon icon={Globe} accent="chart-1" />
                    <Badge variant="secondary" className="text-[10px]">
                      Crawler
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight">
                      Real site crawls
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Our bot walks every page on your site the way Google does —
                      following links, reading robots.txt, and surfacing broken
                      links, missing meta, slow loads, and duplicate titles in
                      seconds.
                    </p>
                  </div>
                  <div className="mt-auto rounded-xl border border-border/50 bg-muted/30 p-4">
                    <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Pages crawled this week</span>
                      <span className="text-foreground">1,284</span>
                    </div>
                    <BarChartMini />
                  </div>
                </GlowCard>
              </TiltCard>
            </motion.div>

            {/* Small cards */}
            {FEATURES.slice(1, 5).map((f) => (
              <motion.div key={f.title} variants={staggerItem}>
                <TiltCard max={6} className="h-full rounded-2xl">
                  <GlowCard className="flex h-full flex-col gap-3 rounded-2xl p-5">
                    <GradientIcon icon={f.icon} accent={f.accent} />
                    <h3 className="text-base font-semibold tracking-tight">
                      {f.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </GlowCard>
                </TiltCard>
              </motion.div>
            ))}

            {/* Large card 2 — Scheduled audits (full width) */}
            <motion.div
              variants={staggerItem}
              className="sm:col-span-2 lg:col-span-4"
            >
              <TiltCard max={4} className="h-full rounded-2xl">
                <GlowCard className="flex h-full flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex max-w-xl flex-col gap-3">
                    <GradientIcon icon={CalendarClock} accent="chart-2" />
                    <h3 className="text-xl font-semibold tracking-tight">
                      Scheduled audits
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Set it and forget it. Hourly, daily, or weekly audits run
                      automatically and alert you the moment a regression slips
                      in — no manual re-checks, no surprises.
                    </p>
                  </div>
                  {/* weekly schedule strip */}
                  <div className="flex gap-2">
                    {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
                      const today = i === 3;
                      const scheduled = i < 5;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex h-14 w-9 flex-col items-center justify-center gap-1 rounded-lg border text-[10px] font-medium",
                            today
                              ? "border-primary bg-primary/15 text-primary"
                              : scheduled
                                ? "border-border/60 bg-muted/40 text-muted-foreground"
                                : "border-dashed border-border/50 text-muted-foreground/50"
                          )}
                        >
                          <span>{d}</span>
                          {today ? (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                            </span>
                          ) : scheduled ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </GlowCard>
              </TiltCard>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="relative scroll-mt-24 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="How it works"
            title={
              <>
                From URL to ranking in{" "}
                <span className="brand-gradient-text">three steps</span>
              </>
            }
            desc="No setup wizard. No agency retainer. Just drop in your URL and watch SEOScout go to work."
          />

          <div className="relative mt-16">
            {/* connecting line (desktop) */}
            <div
              aria-hidden
              className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
            />
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8"
            >
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.title}
                  variants={staggerItem}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-full brand-gradient text-white shadow-lg shadow-primary/30">
                    <step.icon className="h-6 w-6" />
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-card text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ LIVE STATS BAND ============ */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="glass-panel relative overflow-hidden rounded-3xl px-6 py-12 sm:px-12">
            <div className="absolute inset-0 dot-grid opacity-30" aria-hidden />
            <div className="relative grid grid-cols-2 gap-8 md:grid-cols-4">
              {LIVE_STATS.map((stat) => (
                <Reveal key={stat.label} className="text-center">
                  <div className="text-3xl font-bold tracking-tight text-glow sm:text-4xl md:text-5xl">
                    {stat.prefix}
                    <AnimatedCounter
                      value={stat.value}
                      format={(n) => Math.round(n).toLocaleString()}
                    />
                    {stat.suffix}
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground sm:text-sm">
                    {stat.label}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="Testimonials"
            title={
              <>
                Loved by{" "}
                <span className="brand-gradient-text">SEO teams</span>
              </>
            }
            desc="Founders, growth leads, and agencies use SEOScout to ship faster and report smarter."
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3"
          >
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.name} variants={staggerItem}>
                <GlowCard className="flex h-full flex-col gap-5 rounded-2xl p-6">
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-foreground/90">
                    “{t.quote}”
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full brand-gradient text-sm font-semibold text-white">
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="relative scroll-mt-24 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="Pricing"
            title={
              <>
                Simple pricing that{" "}
                <span className="brand-gradient-text">scales with you</span>
              </>
            }
            desc="Start free for 14 days. No credit card required. Cancel anytime."
          />

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <Reveal key={plan.name}>
                <div
                  className={cn(
                    "relative flex h-full flex-col rounded-2xl border bg-card p-6 transition-colors",
                    plan.highlighted
                      ? "conic-border border-primary/40 glow-primary"
                      : "border-border/60 hover:border-border"
                  )}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground shadow-md">
                        <Sparkles className="h-3 w-3" />
                        Most popular
                      </Badge>
                    </div>
                  )}

                  <div className="mb-1 text-sm font-semibold text-primary">
                    {plan.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {plan.tagline}
                  </div>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>

                  <Separator className="my-5" />

                  <ul className="flex-1 space-y-3">
                    {plan.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2.5 text-sm"
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                            plan.highlighted
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/15 text-primary"
                          )}
                        >
                          <Check className="h-2.5 w-2.5" />
                        </span>
                        <span className="text-foreground/90">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <MagneticButton
                    as="button"
                    onClick={onStart}
                    className={cn(
                      "mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors",
                      plan.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </MagneticButton>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-panel noise-overlay relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-12 sm:py-20">
            {/* inner glow orbs */}
            <div
              aria-hidden
              className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-primary/30 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-chart-2/30 blur-3xl"
            />

            <div className="relative">
              <Reveal>
                <Badge
                  variant="secondary"
                  className="mb-5 rounded-full border-primary/20 bg-primary/10 px-3 text-[11px] font-medium uppercase tracking-wider text-primary"
                >
                  Get started
                </Badge>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                  Ready to automate your SEO?
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mx-auto mt-4 max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
                  Join thousands of teams shipping SEO wins with SEOScout. Free
                  for 14 days, no credit card required.
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="mt-8 flex justify-center">
                  <MagneticButton
                    as="button"
                    onClick={onStart}
                    className="glow-primary inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Start free
                    <ArrowRight className="h-4 w-4" />
                  </MagneticButton>
                </div>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    14-day free trial
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    No credit card
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-emerald-500" />
                    Cancel anytime
                  </span>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative border-t border-border/60 pt-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
            {/* brand col */}
            <div className="col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white shadow-md shadow-primary/30">
                  <Search className="h-4.5 w-4.5" />
                </div>
                <span className="text-base font-semibold tracking-tight">
                  SEO<span className="text-primary">Scout</span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                AI-Powered SEO automation. Crawl, audit, generate, and track —
                all in one intelligent platform.
              </p>
              <div className="mt-5 flex gap-2">
                {[Twitter, Github, Linkedin].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
                    aria-label="Social link"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* link cols */}
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold">{col.title}</h4>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col items-center justify-between gap-4 pb-8 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} SEOScout, Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero stat                                                          */
/* ------------------------------------------------------------------ */

function HeroStat({
  value,
  label,
  prefix,
  suffix,
}: {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xl font-bold tracking-tight sm:text-2xl">
        {prefix}
        <AnimatedCounter
          value={value}
          format={(n) => Math.round(n).toLocaleString()}
        />
        {suffix}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
