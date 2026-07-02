"use client";

import { motion } from "framer-motion";
import { useUI, type View } from "@/lib/store";
import { useMe, useLogout, useSites } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Globe,
  Sparkles,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  Search,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useState } from "react";

const NAV: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "sites", label: "Sites & Audits", icon: Globe },
  { id: "content", label: "Content Studio", icon: Sparkles },
  { id: "keywords", label: "Keywords", icon: TrendingUp },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { view, setView } = useUI();
  const { data: me } = useMe();
  const logout = useLogout();

  const user = me?.user;
  const initials = user
    ? (user.name || user.email).slice(0, 2).toUpperCase()
    : "??";

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* brand */}
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white shadow-sm">
          <Search className="h-4.5 w-4.5" />
        </div>
        <span className="text-lg font-semibold tracking-tight">SEOScout</span>
      </div>

      {/* site selector */}
      <div className="px-3 pt-4">
        <SiteSelector />
      </div>

      {/* nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {NAV.map((item) => {
            const active = view === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  onNavigate?.();
                }}
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-sidebar-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    style={{ zIndex: 0 }}
                  />
                )}
                <Icon className="relative z-10 h-4.5 w-4.5" />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* user */}
      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-sidebar-accent transition-colors">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="brand-gradient text-white text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="truncate">
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setView("settings");
                onNavigate?.();
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await logout.mutateAsync();
                toast.success("Signed out");
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function SiteSelector() {
  const { selectedSiteId, setSelectedSiteId, setView } = useUI();
  const { data, isLoading } = useSites();
  const [open, setOpen] = useState(false);
  const sites = data?.sites ?? [];
  const selected = sites.find((s) => s.id === selectedSiteId) ?? null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-11 font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Globe className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">
              {isLoading
                ? "Loading…"
                : selected
                ? selected.name
                : sites.length
                ? "Select a site"
                : "No sites yet"}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[260px]">
        <DropdownMenuLabel>Your sites</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sites.length === 0 && (
          <div className="px-2 py-3 text-sm text-muted-foreground">
            No sites yet. Add one in Sites &amp; Audits.
          </div>
        )}
        {sites.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => {
              setSelectedSiteId(s.id);
              setOpen(false);
            }}
            className="justify-between"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{s.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {s.url}
              </span>
            </span>
            {selectedSiteId === s.id && (
              <Check className="h-4 w-4 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setView("sites");
            setOpen(false);
          }}
          className="text-primary focus:text-primary"
        >
          <Globe className="mr-2 h-4 w-4" />
          Manage sites
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
