"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGenerateContent,
  useImproveContent,
  type GeneratedContent,
  type ImprovedContent,
} from "@/hooks/use-api";
import { useUI } from "@/lib/store";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Markdown } from "@/components/shared/markdown";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Wand2,
  Loader2,
  Copy,
  Check,
  FileText,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";

export function ContentStudioView() {
  const [tab, setTab] = useState<"generate" | "improve">("generate");
  return (
    <>
      <PageHeader
        title="Content Studio"
        description="Generate SEO-optimized content or improve existing copy with AI."
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="mb-5">
          <TabsTrigger value="generate">
            <Sparkles className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="improve">
            <Wand2 className="h-4 w-4" />
            Improve
          </TabsTrigger>
        </TabsList>
        <TabsContent value="generate">
          <GeneratePanel />
        </TabsContent>
        <TabsContent value="improve">
          <ImprovePanel />
        </TabsContent>
      </Tabs>
    </>
  );
}

/* ---------------- Generate ---------------- */
function GeneratePanel() {
  const { selectedSiteId } = useUI();
  const [keyword, setKeyword] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("professional");
  const gen = useGenerateContent();
  const data = gen.data?.content;

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      {/* form */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Generate content</CardTitle>
          <CardDescription>
            Provide a target keyword and optional context. AI returns a
            complete, ready-to-publish draft in seconds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="keyword">Target keyword</Label>
            <Input
              id="keyword"
              placeholder="best running shoes for flat feet"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="context">Context / angle (optional)</Label>
            <Textarea
              id="context"
              placeholder="Target audience: beginners. Include a comparison table. Mention our brand Acme."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger id="tone" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="authoritative">Authoritative</SelectItem>
                <SelectItem value="playful">Playful</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            disabled={gen.isPending || !keyword.trim()}
            onClick={async () => {
              try {
                await gen.mutateAsync({
                  keyword,
                  context: context || undefined,
                  tone,
                  siteId: selectedSiteId,
                });
                toast.success("Content generated!");
              } catch (err) {
                toast.error((err as Error).message || "Generation failed");
              }
            }}
          >
            {gen.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating… (this can take ~20s)
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate content
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Output includes title tag, meta description, H1, body copy, and
            related keywords.
          </p>
        </CardContent>
      </Card>

      {/* output */}
      <div className="lg:col-span-3">
        <GenerateOutput loading={gen.isPending} data={data} />
      </div>
    </div>
  );
}

function GenerateOutput({
  loading,
  data,
}: {
  loading: boolean;
  data?: GeneratedContent;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI is writing your content…
          </div>
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }
  if (!data) {
    return (
      <Card className="h-full">
        <CardContent className="h-full p-6">
          <EmptyState
            icon={FileText}
            title="Your generated content will appear here"
            description="Fill in the form and let AI craft an SEO-optimized draft for you."
            className="h-full border-0 bg-transparent"
          />
        </CardContent>
      </Card>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Meta elements</CardTitle>
            <CopyButton text={`${data.titleTag}\n${data.metaDescription}`} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Title tag" value={data.titleTag} hint={`${data.titleTag.length}/60 chars`} />
          <Field
            label="Meta description"
            value={data.metaDescription}
            hint={`${data.metaDescription.length}/155 chars`}
          />
          <Field label="H1" value={data.h1} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Body copy</CardTitle>
            <CopyButton text={data.body} />
          </div>
        </CardHeader>
        <CardContent>
          <Markdown className="prose-sm">{data.body}</Markdown>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-primary" />
            Suggested related keywords
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.keywordsSuggested.map((k) => (
              <Badge key={k} variant="secondary" className="font-normal">
                {k}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ---------------- Improve ---------------- */
function ImprovePanel() {
  const { selectedSiteId } = useUI();
  const [content, setContent] = useState("");
  const [keyword, setKeyword] = useState("");
  const improve = useImproveContent();
  const data = improve.data?.result;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Improve existing content</CardTitle>
          <CardDescription>
            Paste your copy and a target keyword. AI rewrites it for better SEO
            and readability — preserving your meaning.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="imp-kw">Target keyword</Label>
              <Input
                id="imp-kw"
                placeholder="organic coffee beans"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="imp-content">Original content</Label>
              <Textarea
                id="imp-content"
                placeholder="Paste your existing article or page copy here…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="resize-y"
              />
            </div>
            <Button
              disabled={improve.isPending || !content.trim() || !keyword.trim()}
              onClick={async () => {
                try {
                  await improve.mutateAsync({
                    content,
                    keyword,
                    siteId: selectedSiteId,
                  });
                  toast.success("Content improved!");
                } catch (err) {
                  toast.error((err as Error).message || "Improvement failed");
                }
              }}
            >
              {improve.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Improving…
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Improve content
                </>
              )}
            </Button>
          </div>

          <ImproveOutput loading={improve.isPending} data={data} />
        </CardContent>
      </Card>
    </div>
  );
}

function ImproveOutput({
  loading,
  data,
}: {
  loading: boolean;
  data?: ImprovedContent;
}) {
  if (loading) {
    return (
      <div className="space-y-3 rounded-lg border border-border/60 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          AI is rewriting your content…
        </div>
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border/60 p-8 text-center">
        <div>
          <ArrowRight className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Your improved content will appear here.
          </p>
        </div>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Improved version
        </span>
        <CopyButton text={data.improved} />
      </div>
      <Markdown className="prose-sm">{data.improved}</Markdown>
      {data.changes.length > 0 && (
        <div className="mt-3 rounded-lg border border-border/60 bg-card p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Changes made
          </p>
          <ul className="space-y-1">
            {data.changes.map((c, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

/* ---------------- helpers ---------------- */
function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm">
        {value}
      </p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast.success("Copied to clipboard");
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Couldn't copy");
        }
      }}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      Copy
    </Button>
  );
}
