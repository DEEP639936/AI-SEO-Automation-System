"use client";

import { useState } from "react";
import { useMe, useLogout } from "@/hooks/use-api";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Bell,
  KeyRound,
  Shield,
  Check,
  X,
  LogOut,
  Mail,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

export function SettingsView() {
  const { data: me } = useMe();
  const logout = useLogout();
  const user = me?.user;
  const [name, setName] = useState(user?.name ?? "");
  const [emailNotif, setEmailNotif] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [crawlAlerts, setCrawlAlerts] = useState(false);

  // API key status — "demo" means demo mode (shows connected with a Demo
  // badge). Any other truthy value means a real key is configured.
  const gscStatus = process.env.NEXT_PUBLIC_GSC_CONNECTED;
  const semrushStatus = process.env.NEXT_PUBLIC_SEMRUSH_CONNECTED;
  const resendStatus = process.env.NEXT_PUBLIC_RESEND_CONNECTED;
  const hasGsc = !!gscStatus;
  const hasSemrush = !!semrushStatus;
  const hasResend = !!resendStatus;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your profile, notifications, and integrations."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>Your account information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email ?? ""}
                disabled
                className="h-10 bg-muted/40"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Role</span>
              </div>
              <Badge variant="secondary" className="capitalize">
                {user?.role ?? "owner"}
              </Badge>
            </div>
            <Button onClick={() => toast.success("Profile saved")}>
              <Check className="h-4 w-4" />
              Save changes
            </Button>
          </CardContent>
        </Card>

        {/* notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>
              Choose what we email you and when.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <ToggleRow
              icon={Mail}
              title="Email notifications"
              description="Receive account and SEO alerts via email."
              checked={emailNotif}
              onChange={setEmailNotif}
            />
            <Separator className="my-1" />
            <ToggleRow
              icon={Clock}
              title="Weekly digest"
              description="A summary of your sites' SEO health every Monday."
              checked={weeklyDigest}
              onChange={setWeeklyDigest}
            />
            <Separator className="my-1" />
            <ToggleRow
              icon={Bell}
              title="Critical crawl alerts"
              description="Notify me immediately when a crawl finds critical issues."
              checked={crawlAlerts}
              onChange={setCrawlAlerts}
            />
            <div className="pt-3">
              <Button
                variant="outline"
                onClick={() => toast.success("Notification preferences saved")}
              >
                Save preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* integrations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" />
              Integrations & API keys
            </CardTitle>
            <CardDescription>
              Connect data sources for live rankings and email delivery. Keys
              are configured server-side via environment variables.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <IntegrationRow
              name="Google Search Console"
              envVar="GSC_SERVICE_ACCOUNT_JSON"
              connected={hasGsc}
              demo={gscStatus === "demo"}
              description="Live keyword ranking data from your verified properties."
            />
            <IntegrationRow
              name="SEMrush API"
              envVar="SEMRUSH_API_KEY"
              connected={hasSemrush}
              demo={semrushStatus === "demo"}
              description="Alternative ranking + backlink data source."
            />
            <IntegrationRow
              name="Resend (email)"
              envVar="RESEND_API_KEY"
              connected={hasResend}
              demo={resendStatus === "demo"}
              description="Automated report delivery to stakeholders."
            />
            <IntegrationRow
              name="Anthropic Claude"
              envVar="ANTHROPIC_API_KEY"
              connected
              description="AI content generation & audit analysis (via z-ai SDK)."
              builtin
            />
          </CardContent>
        </Card>

        {/* danger zone */}
        <Card className="lg:col-span-2 border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <LogOut className="h-4 w-4" />
              Session
            </CardTitle>
            <CardDescription>Sign out of your account on this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={async () => {
                await logout.mutateAsync();
                toast.success("Signed out");
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function IntegrationRow({
  name,
  envVar,
  connected,
  demo,
  description,
  builtin,
}: {
  name: string;
  envVar: string;
  connected: boolean;
  demo?: boolean;
  description: string;
  builtin?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{name}</p>
          {connected ? (
            <Badge className="gap-1 bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25">
              <Check className="h-3 w-3" /> {builtin ? "Active" : "Connected"}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <X className="h-3 w-3" /> Not connected
            </Badge>
          )}
          {demo && (
            <Badge variant="secondary" className="gap-1 text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20">
              Demo
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        {!builtin && (
          <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
            env: {envVar}
            {demo && " — set a real key to go live"}
          </p>
        )}
      </div>
    </div>
  );
}
