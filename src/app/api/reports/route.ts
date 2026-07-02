import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");

    const reports = await db.report.findMany({
      where: { site: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { site: { select: { name: true, url: true } } },
    });
    return ok({ reports });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Unauthorized", 401, "unauthorized");

    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid JSON body", 400);
    const siteId = String(body.siteId ?? "");
    if (!siteId) return fail("siteId is required", 422, "missing_site");

    const site = await db.site.findFirst({
      where: { id: siteId, userId: user.id },
    });
    if (!site) return fail("Site not found", 404, "not_found");

    const audit = await db.audit.findFirst({
      where: { siteId },
      orderBy: { runAt: "desc" },
      include: { issues: true },
    });

    const keywords = await db.keyword.findMany({
      where: { siteId },
      include: { rankings: { orderBy: { checkedAt: "asc" } } },
    });

    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 7 * 86_400_000);

    const counts = { critical: 0, warning: 0, info: 0 };
    if (audit) {
      for (const i of audit.issues) counts[i.severity as keyof typeof counts]++;
    }

    const { html, text } = buildReport({
      siteName: site.name,
      siteUrl: site.url,
      periodStart,
      periodEnd,
      score: audit?.score ?? null,
      pagesCrawled: audit?.pagesCrawled ?? 0,
      issueCounts: counts,
      totalIssues: audit?.issues.length ?? 0,
      topIssues: (audit?.issues ?? []).slice(0, 8),
      keywords: keywords.map((k) => ({
        keyword: k.keyword,
        latest: k.rankings.length
          ? k.rankings[k.rankings.length - 1].position
          : null,
        previous: k.rankings.length > 1
          ? k.rankings[k.rankings.length - 2].position
          : null,
      })),
    });

    const report = await db.report.create({
      data: {
        siteId,
        periodStart,
        periodEnd,
        title: `${site.name} — Weekly SEO Report`,
        bodyHtml: html,
        bodyText: text,
      },
      include: { site: { select: { name: true, url: true } } },
    });

    // NOTE: Email delivery requires RESEND_API_KEY (or SMTP). When absent we
    // simply persist the report for in-app viewing/download. When present a
    // real send would be wired here.
    return ok({ report });
  } catch (err) {
    return handleError(err);
  }
}

function buildReport(args: {
  siteName: string;
  siteUrl: string;
  periodStart: Date;
  periodEnd: Date;
  score: number | null;
  pagesCrawled: number;
  issueCounts: { critical: number; warning: number; info: number };
  totalIssues: number;
  topIssues: { type: string; severity: string; url: string; detail: string }[];
  keywords: { keyword: string; latest: number | null; previous: number | null }[];
}): { html: string; text: string } {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const scoreColor =
    args.score == null
      ? "#64748b"
      : args.score >= 80
      ? "#10b981"
      : args.score >= 50
      ? "#f59e0b"
      : "#ef4444";

  const issueRows = args.topIssues
    .map(
      (i) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0"><span style="text-transform:capitalize;color:${sevColor(i.severity)};font-weight:600">${i.severity}</span></td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:13px">${escapeHtml(i.type)}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#475569;word-break:break-all">${escapeHtml(i.url)}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#475569">${escapeHtml(i.detail)}</td>
      </tr>`
    )
    .join("");

  const kwRows = args.keywords
    .map((k) => {
      const delta =
        k.latest != null && k.previous != null ? k.previous - k.latest : 0;
      const trend =
        delta > 0
          ? `<span style="color:#10b981">▲ +${delta}</span>`
          : delta < 0
          ? `<span style="color:#ef4444">▼ ${delta}</span>`
          : `<span style="color:#64748b">—</span>`;
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:500">${escapeHtml(k.keyword)}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0">${k.latest == null ? "—" : "#" + k.latest}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0">${trend}</td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(args.siteName)} SEO Report</title></head>
<body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a">
  <div style="max-width:720px;margin:0 auto;padding:32px 24px">
    <div style="background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;padding:32px;border-radius:16px">
      <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.8">Weekly SEO Report</div>
      <h1 style="margin:8px 0 0;font-size:28px">${escapeHtml(args.siteName)}</h1>
      <div style="margin-top:6px;opacity:.9;font-size:14px">${escapeHtml(args.siteUrl)} · ${fmt(args.periodStart)} → ${fmt(args.periodEnd)}</div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:24px">
      <div style="background:#fff;padding:16px;border-radius:12px;border:1px solid #e2e8f0">
        <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Health Score</div>
        <div style="font-size:28px;font-weight:700;color:${scoreColor};margin-top:4px">${args.score == null ? "—" : args.score}</div>
      </div>
      <div style="background:#fff;padding:16px;border-radius:12px;border:1px solid #e2e8f0">
        <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Critical</div>
        <div style="font-size:28px;font-weight:700;color:#ef4444;margin-top:4px">${args.issueCounts.critical}</div>
      </div>
      <div style="background:#fff;padding:16px;border-radius:12px;border:1px solid #e2e8f0">
        <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Warnings</div>
        <div style="font-size:28px;font-weight:700;color:#f59e0b;margin-top:4px">${args.issueCounts.warning}</div>
      </div>
      <div style="background:#fff;padding:16px;border-radius:12px;border:1px solid #e2e8f0">
        <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Pages Crawled</div>
        <div style="font-size:28px;font-weight:700;color:#0ea5e9;margin-top:4px">${args.pagesCrawled}</div>
      </div>
    </div>

    <h2 style="margin-top:32px;font-size:18px">Top Issues</h2>
    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <thead><tr style="background:#f1f5f9;text-align:left;font-size:12px;text-transform:uppercase;color:#64748b">
        <th style="padding:10px 8px">Severity</th><th style="padding:10px 8px">Type</th><th style="padding:10px 8px">URL</th><th style="padding:10px 8px">Detail</th>
      </tr></thead>
      <tbody>${issueRows || `<tr><td colspan="4" style="padding:16px;text-align:center;color:#94a3b8">No issues detected 🎉</td></tr>`}</tbody>
    </table>

    <h2 style="margin-top:32px;font-size:18px">Keyword Rankings</h2>
    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <thead><tr style="background:#f1f5f9;text-align:left;font-size:12px;text-transform:uppercase;color:#64748b">
        <th style="padding:10px 8px">Keyword</th><th style="padding:10px 8px">Position</th><th style="padding:10px 8px">Change</th>
      </tr></thead>
      <tbody>${kwRows || `<tr><td colspan="3" style="padding:16px;text-align:center;color:#94a3b8">No keywords tracked yet.</td></tr>`}</tbody>
    </table>

    <p style="margin-top:32px;font-size:12px;color:#94a3b8">Generated by SEOScout AI · ${new Date().toISOString()}</p>
  </div>
</body></html>`;

  const text = `SEOScout Weekly SEO Report\n${args.siteName} (${args.siteUrl})\n${fmt(args.periodStart)} - ${fmt(args.periodEnd)}\n\nHealth score: ${args.score ?? "n/a"}\nCritical: ${args.issueCounts.critical}  Warnings: ${args.issueCounts.warning}  Pages: ${args.pagesCrawled}\n\nTop issues:\n${args.topIssues.map((i) => `- [${i.severity}] ${i.type} on ${i.url}: ${i.detail}`).join("\n")}\n\nKeywords:\n${args.keywords.map((k) => `- ${k.keyword}: #${k.latest ?? "n/a"}`).join("\n")}\n`;

  return { html, text };
}

function sevColor(s: string) {
  return s === "critical" ? "#ef4444" : s === "warning" ? "#f59e0b" : "#0ea5e9";
}
function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
