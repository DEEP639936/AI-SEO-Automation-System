"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLogin, useRegister, useMe, ApiError } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Search,
  Sparkles,
  TrendingUp,
  Bug,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(0);

  const login = useLogin();
  const register = useRegister();

  function validate() {
    const e: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Enter a valid email address";
    if (password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (mode === "register" && name.trim().length < 2)
      e.name = "Tell us your name";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (mode === "login") {
        await login.mutateAsync({ email, password });
        toast.success("Welcome back!");
      } else {
        await register.mutateAsync({ email, password, name });
        toast.success("Account created — welcome to SEOScout!");
      }
    } catch (err) {
      setShake((s) => s + 1);
      const apiErr = err as ApiError;
      const msg =
        apiErr?.message || "Something went wrong. Please try again.";
      if (apiErr?.code === "invalid_credentials")
        setErrors({ form: "Incorrect email or password" });
      else if (apiErr?.code === "email_taken")
        setErrors({ form: "An account with this email already exists" });
      else setErrors({ form: msg });
      toast.error(msg);
    }
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* ---------- Left: brand / illustration panel ---------- */}
      <div className="relative hidden overflow-hidden brand-gradient lg:flex lg:flex-col lg:justify-between p-12 text-white">
        <div className="absolute inset-0 grid-bg opacity-20" />
        {/* floating orbs */}
        <motion.div
          aria-hidden
          className="absolute -top-24 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl"
          animate={{ y: [0, 24, 0], x: [0, -12, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute bottom-10 -left-16 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl"
          animate={{ y: [0, -28, 0], x: [0, 18, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Search className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">SEOScout</span>
        </div>

        <div className="relative z-10 max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl font-bold leading-tight tracking-tight"
          >
            Automate your SEO.
            <br />
            <span className="text-white/80">Rank higher, faster.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 text-white/70"
          >
            Crawl, audit, generate AI content, and track rankings — all in one
            intelligent platform that works while you sleep.
          </motion.p>

          <div className="mt-10 space-y-3">
            {[
              { icon: Bug, text: "Real site crawls that catch SEO issues early" },
              { icon: Sparkles, text: "AI content generation in under 60 seconds" },
              { icon: TrendingUp, text: "Live keyword rank tracking with trends" },
              { icon: BarChart3, text: "Automated weekly reports to stakeholders" },
            ].map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.08 }}
                className="flex items-center gap-3 text-sm text-white/85"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/12">
                  <f.icon className="h-4 w-4" />
                </div>
                {f.text}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/50">
          © {new Date().getFullYear()} SEOScout. Built for modern marketing teams.
        </div>
      </div>

      {/* ---------- Right: form panel ---------- */}
      <div className="flex flex-col items-center justify-center px-6 py-12 mesh-bg">
        <motion.div
          key={mode + String(shake)}
          initial={{ opacity: 0, y: 16 }}
          animate={{
            opacity: 1,
            y: 0,
            x: shake ? [0, -8, 8, -6, 6, 0] : 0,
          }}
          transition={{ duration: shake ? 0.4 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          {/* mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white">
              <Search className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">SEOScout</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to your SEO command center."
              : "Start automating your SEO in minutes."}
          </p>

          {/* Google OAuth (demo) */}
          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full"
            onClick={() => {
              toast.info(
                "Google OAuth requires client credentials. Use email sign-in for this demo.",
                { duration: 4500 }
              );
            }}
          >
            <GoogleIcon className="h-4 w-4" />
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {mode === "register" && (
              <Field
                id="name"
                label="Full name"
                value={name}
                onChange={setName}
                placeholder="Ada Lovelace"
                error={errors.name}
                autoComplete="name"
              />
            )}
            <Field
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
              error={errors.email}
              icon={<Mail className="h-4 w-4" />}
              autoComplete="email"
            />
            <PasswordField
              value={password}
              onChange={setPassword}
              show={showPw}
              onToggle={() => setShowPw((s) => !s)}
              error={errors.password}
            />

            {errors.form && (
              <p className="text-sm text-destructive" role="alert">
                {errors.form}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() =>
                  toast.info("Password reset requires an SMTP key. Contact your admin.", {
                    duration: 4000,
                  })
                }
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold"
              disabled={login.isPending || register.isPending}
            >
              {login.isPending || register.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Please wait…
                </>
              ) : (
                <>
                  {mode === "login" ? "Sign in" : "Create account"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setMode(mode === "login" ? "register" : "login");
              }}
              className="font-semibold text-primary hover:underline"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  icon,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={icon ? "pl-9 h-11" : "h-11"}
          aria-invalid={!!error}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  show,
  onToggle,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="password">Password</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Lock className="h-4 w-4" />
        </span>
        <Input
          id="password"
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          autoComplete={show ? "off" : "current-password"}
          className="pl-9 pr-10 h-11"
          aria-invalid={!!error}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
      )}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
