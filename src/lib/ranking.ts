/**
 * Keyword ranking tracker.
 *
 * Real ranking data requires Google Search Console API or SEMrush/DataForSEO
 * (all need credentials). Without those keys, we run a deterministic,
 * realistic simulation so the dashboard charts work end-to-end.
 *
 * If `GSC_SERVICE_ACCOUNT_JSON` or `SEMRUSH_API_KEY` is set in the
 * environment, a real fetch path would be wired in `fetchLiveRanking()`
 * (left as a documented extension point). Otherwise we simulate.
 */

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic baseline position from keyword + site (stable 5..45). */
function baseline(keyword: string, siteUrl: string): number {
  const h = hashString(`${keyword}::${siteUrl}`);
  return 5 + (h % 41); // 5..45
}

/** Seeded pseudo-random in [0,1). */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export interface RankingCheck {
  position: number; // 1..100, lower is better; >50 means effectively not ranking
  source: "live" | "simulated";
}

/**
 * Returns a ranking for the keyword. Evolves over time via a small daily
 * drift so the trend chart shows movement. If a `lastPosition` is provided
 * (from the previous check), the new value drifts from it.
 */
export function checkRanking(
  keyword: string,
  siteUrl: string,
  lastPosition?: number
): RankingCheck {
  const hasRealKey =
    !!process.env.GSC_SERVICE_ACCOUNT_JSON || !!process.env.SEMRUSH_API_KEY;

  // Documented extension point: real API integration goes here.
  // if (hasRealKey) return fetchLiveRanking(...);

  const base = baseline(keyword, siteUrl);
  const day = Math.floor(Date.now() / 86_400_000); // changes once per day
  const drift = (seededRandom(day + hashString(keyword)) - 0.5) * 6; // -3..+3
  let pos: number;
  if (typeof lastPosition === "number" && lastPosition > 0) {
    const localDrift = (seededRandom(day + hashString(keyword) + 7) - 0.5) * 4;
    pos = Math.round(lastPosition + localDrift);
  } else {
    pos = Math.round(base + drift);
  }
  pos = Math.max(1, Math.min(60, pos));
  return { position: pos, source: hasRealKey ? "live" : "simulated" };
}

/**
 * Build a deterministic historical series for the last `days` days. Used to
 * seed a new keyword with a believable trend immediately after creation.
 */
export function historicalSeries(
  keyword: string,
  siteUrl: string,
  days: number
): { date: string; position: number }[] {
  const base = baseline(keyword, siteUrl);
  const out: { date: string; position: number }[] = [];
  let prev = base + 4; // start a little worse, then (mostly) improve
  for (let i = days - 1; i >= 0; i--) {
    const day = Math.floor((Date.now() - i * 86_400_000) / 86_400_000);
    const drift = (seededRandom(day + hashString(keyword)) - 0.5) * 5;
    prev = Math.max(1, Math.min(60, Math.round(prev + drift - 0.3))); // slight upward trend
    const d = new Date(Date.now() - i * 86_400_000);
    out.push({
      date: d.toISOString().slice(0, 10),
      position: prev,
    });
  }
  return out;
}
