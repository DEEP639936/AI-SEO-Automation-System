"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMe } from "@/hooks/use-api";
import { AuthScreen } from "@/components/auth/auth-screen";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LandingPage } from "@/components/marketing/landing-page";
import { AuroraBackground } from "@/components/shared/aurora-background";
import { Search, Loader2 } from "lucide-react";

type PreAuthScreen = "landing" | "auth";

export default function HomePage() {
  const { data, isLoading, isError } = useMe();
  const [preAuth, setPreAuth] = useState<PreAuthScreen>(() => {
    if (typeof window === "undefined") return "landing";
    return sessionStorage.getItem("seoscout:preauth") === "auth"
      ? "auth"
      : "landing";
  });

  // Persist the pre-auth choice so a refresh doesn't kick a returning visitor
  // back to the marketing page mid-signup.
  useEffect(() => {
    sessionStorage.setItem("seoscout:preauth", preAuth);
  }, [preAuth]);

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-4">
        <AuroraBackground />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient text-white shadow-xl glow-primary"
        >
          <Search className="h-7 w-7" />
        </motion.div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading SEOScout…
        </div>
      </div>
    );
  }

  // Authenticated → dashboard
  if (!isError && data?.user) {
    return <DashboardShell />;
  }

  // Unauthenticated → landing (default) or auth screen
  if (preAuth === "auth") {
    return <AuthScreen onBack={() => setPreAuth("landing")} />;
  }

  return (
    <LandingPage
      onStart={() => setPreAuth("auth")}
      onSignIn={() => setPreAuth("auth")}
    />
  );
}
