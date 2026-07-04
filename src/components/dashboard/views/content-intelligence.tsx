"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useIntelligence, type IntelligenceResult } from "@/hooks/use-api";
import { ProCard, ProCardHeader } from "@/components/shared/pro-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Brain,
  Sparkles,
  TrendingUp,
  BookOpen,
  Cpu,
  Loader2,
  Gauge,
  Activity,
  Hash,
  Type,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ContentIntelligence({
  text,
  keyword,
  headingCount = 0,
}: {
  text: string;
  keyword: string;
  headingCount?: number;
}) {
  const intel = useIntelligence();
  const data = intel.data;
  const canAnalyze = text.trim().length > 20;

  return (
    <ProCard hover={false} className="overflow-hidden">
      <ProCardHeader
        icon={<Brain className="h-4.5 w-4.5" />}
        title="Content Intelligence"
        description="NLP · Machine Learning · Deep Learning · RAG — powered by the Python service"
        action={
          <Button
            size="sm"
            onClick={() => intel.mutate({ text, keyword, headingCount })}
            disabled={intel.isPending || !canAnalyze}
          >
            {intel.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Run analysis
              </>
            )}
          </Button>
        }
      />

      <div className="p-5">
        <AnimatePresence mode="wait">
          {intel.isError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              Analysis failed: {(intel.error as Error)?.message}. Make sure the
              Python ML service is running on port 8001.
            </motion.div>
          ) : intel.isPending ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="shimmer h-24 rounded-lg" />
                ))}
              </div>
              <div className="shimmer h-20 rounded-lg" />
              <p className="text-center text-xs text-muted-foreground">
                Running NLP, ML, Deep Learning & RAG pipelines…
              </p>
            </motion.div>
          ) : data ? (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Score row */}
              <div className="grid gap-3 sm:grid-cols-3">
                {data.ml && (
                  <ScoreTile
                    icon={<Gauge className="h-4 w-4" />}
                    label="ML SEO Score"
                    value={data.ml.predicted_score}
                    band={data.ml.confidence_band}
                    sub={`MAE ${data.ml.training_mae} · R² ${data.ml.training_r2}`}
                  />
                )}
                {data.deep_learning && (
                  <ScoreTile
                    icon={<Cpu className="h-4 w-4" />}
                    label="DL Quality"
                    value={Math.round(data.deep_learning.quality_probability * 100)}
                    band={data.deep_learning.quality_label}
                    sub={`conf ${Math.round(data.deep_learning.confidence * 100)}%`}
                  />
                )}
                {data.nlp && (
                  <ScoreTile
                    icon={<Activity className="h-4 w-4" />}
                    label="Readability"
                    value={data.nlp.readability.flesch_reading_ease}
                    band={data.nlp.readability.interpretation.split("—")[0].trim()}
                    sub={data.nlp.readability.flesch_kincaid_grade >= 0 ? `Grade ${data.nlp.readability.flesch_kincaid_grade}` : ""}
                  />
                )}
              </div>

              {/* Feature contributions (ML) */}
              {data.ml && Object.keys(data.ml.feature_contributions).length > 0 && (
                <FeatureContributions contributions={data.ml.feature_contributions} />
              )}

              {data.ml && <Separator />}

              {/* NLP keywords + stats */}
              {data.nlp && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Hash className="h-3.5 w-3.5" /> NLP Keywords
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {data.nlp.keywords.slice(0, 12).map((k, i) => (
                        <Badge
                          key={i}
                          variant={k.is_target ? "default" : "secondary"}
                          className={cn(
                            "font-mono text-[11px]",
                            k.is_target && "brand-gradient text-white"
                          )}
                        >
                          {k.keyword}
                          {k.is_target && k.density != null && (
                            <span className="ml-1 opacity-80">{k.density}%</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Type className="h-3.5 w-3.5" /> Text Stats
                    </h4>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <Stat label="Words" value={data.nlp.text_stats.word_count} />
                      <Stat label="Sentences" value={data.nlp.text_stats.sentence_count} />
                      <Stat label="Avg words/sent" value={data.nlp.text_stats.avg_words_per_sentence} />
                      <Stat label="Lexical div." value={data.nlp.text_stats.lexical_diversity} />
                      <Stat label="Reading time" value={`${data.nlp.text_stats.reading_time_minutes}m`} />
                      <Stat label="Passive voice" value={`${Math.round(data.nlp.text_stats.passive_sentence_ratio * 100)}%`} />
                    </div>
                  </div>
                </div>
              )}

              {data.rag && (
                <>
                  <Separator />
                  {/* RAG retrieved guidance */}
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" /> RAG — Retrieved SEO Guidance
                    </h4>
                    <p className="mb-2 text-[11px] text-muted-foreground">
                      {data.rag.retriever}
                    </p>
                    <div className="space-y-2">
                      {data.rag.retrieved.map((doc) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: doc.rank * 0.05 }}
                          className="rounded-lg border border-border/60 bg-muted/20 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{doc.title}</p>
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {doc.category}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                            {doc.content}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Model provenance footer */}
              <div className="rounded-lg bg-muted/30 p-3 text-[10px] text-muted-foreground">
                <p className="flex items-center gap-1 font-medium text-foreground">
                  <Lightbulb className="h-3 w-3" /> Models
                </p>
                <p className="mt-1 font-mono leading-relaxed">
                  NLP: TF-IDF + RAKE + Flesch-Kincaid · ML: {data.ml?.model ?? "n/a"}
                  <br />
                  DL: {data.deep_learning?.model ?? "n/a"} · RAG: TF-IDF cosine retrieval
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Brain className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">AI content intelligence</p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Run a full NLP + Machine Learning + Deep Learning + RAG analysis
                on your content. Get an ML-predicted SEO score, a neural-network
                quality classification, readability metrics, and retrieved SEO
                best-practice guidance.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProCard>
  );
}

function ScoreTile({
  icon,
  label,
  value,
  band,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  band?: string;
  sub?: string;
}) {
  const color =
    value >= 75 ? "#10b981" : value >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>
          {value}
        </span>
        {band && (
          <span className="text-xs font-medium text-muted-foreground">{band}</span>
        )}
      </div>
      {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function FeatureContributions({
  contributions,
}: {
  contributions: Record<string, number>;
}) {
  const entries = Object.entries(contributions).filter(([, v]) => v !== 0);
  if (!entries.length) return null;
  const max = Math.max(...entries.map(([, v]) => Math.abs(v)), 1);
  const labels: Record<string, string> = {
    word_count_norm: "Word count",
    keyword_density_norm: "Keyword density",
    readability_norm: "Readability",
    heading_count_norm: "Headings",
    lexical_diversity: "Lexical diversity",
    avg_sentence_len_norm: "Sentence length",
  };
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5" /> ML Feature Impact
      </h4>
      <div className="space-y-1.5">
        {entries
          .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
          .map(([key, val]) => {
            const pct = Math.min(100, (Math.abs(val) / max) * 100);
            const positive = val > 0;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="w-28 shrink-0 text-xs text-muted-foreground">
                  {labels[key] ?? key}
                </span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      "absolute h-full rounded-full",
                      positive ? "bg-emerald-500 left-1/2" : "bg-red-500 right-1/2"
                    )}
                    style={{
                      width: `${pct / 2}%`,
                      [positive ? "left" : "right"]: "50%",
                    } as React.CSSProperties}
                  />
                  <div className="absolute left-1/2 top-0 h-full w-px bg-border" />
                </div>
                <span
                  className={cn(
                    "w-10 shrink-0 text-right text-xs font-mono tabular-nums",
                    positive ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {positive ? "+" : ""}
                  {val.toFixed(1)}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium tabular-nums">{value}</span>
    </div>
  );
}
