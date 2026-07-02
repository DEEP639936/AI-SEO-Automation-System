"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./sidebar";
import { useUI } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Search, Moon, Sun, Github } from "lucide-react";
import { useTheme } from "next-themes";
import { OverviewView } from "./views/overview";
import { SitesView } from "./views/sites";
import { ContentStudioView } from "./views/content-studio";
import { KeywordsView } from "./views/keywords";
import { ReportsView } from "./views/reports";
import { SettingsView } from "./views/settings";

export function DashboardShell() {
  const { view } = useUI();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
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
            className="fixed left-4 top-4 z-40 lg:hidden"
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
        <Header />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                {view === "overview" && <OverviewView />}
                {view === "sites" && <SitesView />}
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
    </div>
  );
}

function Header() {
  const { theme, setTheme } = useTheme();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/70 bg-background/80 px-4 pl-16 backdrop-blur-md sm:px-6 lg:px-8 lg:pl-8">
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg brand-gradient text-white">
          <Search className="h-4 w-4" />
        </div>
      </div>
      <div className="hidden lg:block">
        <p className="text-sm text-muted-foreground">
          Welcome to your SEO command center
        </p>
      </div>
      <div className="flex items-center gap-1.5">
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
    <footer className="mt-auto border-t border-border/70 bg-background/60 px-4 py-4 sm:px-6 lg:px-8">
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
