"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./sidebar";
import { CommandPalette } from "./command-palette";
import { useUI } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AuroraBackground } from "@/components/shared/aurora-background";
import { ScrollProgress } from "@/components/shared/scroll-progress";
import { CursorGlow } from "@/components/shared/cursor-glow";
import { Menu, Search, Moon, Sun, Github, Command, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import { OverviewView } from "./views/overview";
import { SitesView } from "./views/sites";
import { SeoAnalysisView } from "./views/seo-analysis";
import { ContentStudioView } from "./views/content-studio";
import { KeywordsView } from "./views/keywords";
import { ReportsView } from "./views/reports";
import { SettingsView } from "./views/settings";

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Your SEO command center at a glance" },
  sites: { title: "Sites & Audits", subtitle: "Add websites, run crawls, review issues" },
  "seo-analysis": { title: "SEO Analysis", subtitle: "On-Page, Off-Page & Technical SEO breakdown" },
  content: { title: "Content Studio", subtitle: "Generate & improve content with AI" },
  keywords: { title: "Keywords", subtitle: "Track ranking positions over time" },
  reports: { title: "Reports", subtitle: "Generate & review automated SEO reports" },
  settings: { title: "Settings", subtitle: "Profile, notifications & integrations" },
};

export function DashboardShell() {
  const { view } = useUI();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // global Cmd+K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full">
      <ScrollProgress />
      <CursorGlow />
      <AuroraBackground variant="subtle" />

      {/* desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-40 lg:hidden glass-panel"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          view={view}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                {view === "overview" && <OverviewView />}
                {view === "sites" && <SitesView />}
                {view === "seo-analysis" && <SeoAnalysisView />}
                {view === "content" && <ContentStudioView />}
                {view === "keywords" && <KeywordsView />}
                {view === "reports" && <ReportsView />}
                {view === "settings" && <SettingsView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <Footer />
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

function Header({
  view,
  onOpenPalette,
}: {
  view: string;
  onOpenPalette: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const meta = VIEW_TITLES[view] ?? VIEW_TITLES.overview;
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/60 px-4 pl-16 backdrop-blur-xl sm:px-6 lg:px-8 lg:pl-8">
      <div className="min-w-0">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-gradient text-white">
            <Search className="h-4 w-4" />
          </div>
        </div>
        <div className="hidden min-w-0 lg:block">
          <h2 className="truncate text-sm font-semibold">{meta.title}</h2>
          <p className="truncate text-xs text-muted-foreground">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* command palette trigger */}
        <button
          onClick={onOpenPalette}
          className="hidden items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search…</span>
          <kbd className="ml-2 inline-flex h-5 items-center gap-0.5 rounded border border-border/60 bg-background px-1 font-mono text-[10px]">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenPalette}
          className="sm:hidden"
          aria-label="Search"
        >
          <Search className="h-4.5 w-4.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-4.5 w-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4.5 w-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <Button variant="ghost" size="icon" asChild aria-label="Source">
          <a href="https://github.com" target="_blank" rel="noreferrer">
            <Github className="h-4.5 w-4.5" />
          </a>
        </Button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <p>
          © {new Date().getFullYear()} SEOScout — AI-Powered SEO Automation
        </p>
        <p className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          All systems operational
        </p>
      </div>
    </footer>
  );
}
