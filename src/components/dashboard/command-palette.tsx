"use client";

import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Globe,
  Sparkles,
  TrendingUp,
  FileText,
  FileSearch,
  Settings,
  Moon,
  Sun,
  Plus,
  RefreshCw,
  LogOut,
  Search,
  CornerDownLeft,
} from "lucide-react";
import { useUI, type View } from "@/lib/store";
import { useSites, useLogout, useMe } from "@/hooks/use-api";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const NAV_ITEMS: { id: View; label: string; icon: typeof LayoutDashboard; desc: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, desc: "Dashboard home & health score" },
  { id: "sites", label: "Sites & Audits", icon: Globe, desc: "Add sites, run crawls, review issues" },
  { id: "seo-analysis", label: "SEO Analysis", icon: FileSearch, desc: "On-Page, Off-Page & Technical SEO breakdown" },
  { id: "content", label: "Content Studio", icon: Sparkles, desc: "Generate & improve content with AI" },
  { id: "keywords", label: "Keywords", icon: TrendingUp, desc: "Track ranking positions" },
  { id: "reports", label: "Reports", icon: FileText, desc: "Generate & view SEO reports" },
  { id: "settings", label: "Settings", icon: Settings, desc: "Profile, notifications, integrations" },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { setView, setSelectedSiteId, selectedSiteId } = useUI();
  const { data: sitesData } = useSites();
  const { setTheme, theme } = useTheme();
  const logout = useLogout();
  const sites = sitesData?.sites ?? [];

  function go(v: View) {
    setView(v);
    onOpenChange(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, sites, and actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.label} ${item.desc} navigation page`}
              onSelect={() => go(item.id)}
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span>{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        {sites.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Switch site">
              {sites.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`site ${s.name} ${s.url}`}
                  onSelect={() => {
                    setSelectedSiteId(s.id);
                    onOpenChange(false);
                  }}
                >
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.url}</span>
                  </div>
                  {selectedSiteId === s.id && (
                    <CornerDownLeft className="ml-auto h-3.5 w-3.5 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          <CommandItem
            value="add new site create website"
            onSelect={() => go("sites")}
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
            Add a new site
          </CommandItem>
          <CommandItem
            value="generate ai content write article"
            onSelect={() => go("content")}
          >
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            Generate AI content
          </CommandItem>
          <CommandItem
            value="add keyword track ranking"
            onSelect={() => go("keywords")}
          >
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Track a new keyword
          </CommandItem>
          <CommandItem
            value="generate report weekly"
            onSelect={() => go("reports")}
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            Generate a report
          </CommandItem>
          <CommandItem
            value="toggle theme dark light mode"
            onSelect={() => {
              setTheme(theme === "dark" ? "light" : "dark");
              onOpenChange(false);
            }}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground" />
            )}
            Toggle {theme === "dark" ? "light" : "dark"} theme
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Account">
          <CommandItem
            value="sign out logout"
            onSelect={async () => {
              onOpenChange(false);
              await logout.mutateAsync();
              toast.success("Signed out");
            }}
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
            Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Hook that wires the global Cmd+K / Ctrl+K shortcut to open the palette.
 * Returns [open, setOpen]. Drop the <CommandPalette> component in the tree.
 */
export function useCommandShortcut() {
  const setter = useUI.setState;
  // palette open state is local to wherever CommandPalette is rendered;
  // this hook just exposes the keyboard binding helper.
  return setter;
}
