import { NextResponse } from "next/server";

/**
 * Shared helpers for API route handlers.
 */

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, code?: string) {
  return NextResponse.json(
    { detail: message, code: code ?? "error" },
    { status }
  );
}

export function handleError(err: unknown) {
  if (err && typeof err === "object" && "status" in err && "message" in err) {
    const e = err as { status: number; message: string };
    return fail(e.message, e.status);
  }
  console.error("[api] unhandled error:", err);
  return fail("Internal server error", 500);
}

/** SSRF guard: only allow http(s) URLs, block obvious internal targets. */
export function assertSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) URLs are allowed");
  }
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host === "169.254.169.254" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    throw new Error("Crawling internal/private hosts is not allowed");
  }
  return url;
}
