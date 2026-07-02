"use client";

import { useMe } from "@/hooks/use-api";
import { AuthScreen } from "@/components/auth/auth-screen";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Search, Loader2 } from "lucide-react";

export default function HomePage() {
  const { data, isLoading, isError } = useMe();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 mesh-bg">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl brand-gradient text-white shadow-lg">
          <Search className="h-6 w-6" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading SEOScout…
        </div>
      </div>
    );
  }

  // data?.user present → authenticated. isError (401) or no user → show auth.
  if (isError || !data?.user) {
    return <AuthScreen />;
  }

  return <DashboardShell />;
}
