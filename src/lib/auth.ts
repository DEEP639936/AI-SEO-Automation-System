import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

/**
 * Lightweight, dependency-free auth for the SEO automation system.
 *
 * - Passwords hashed with Node's scrypt (NIST-recommended, built-in).
 * - Session = an httpOnly cookie `seoscout_session` containing
 *   `<userId>.<hmac>` where hmac = HMAC-SHA256(secret, userId).
 * - No external JWT lib needed; verification is a constant-time compare.
 *
 * NOTE: This is a single-process app (Next.js route handlers). Sessions are
 * stateless (signed tokens), so they survive restarts.
 */

const SESSION_COOKIE = "seoscout_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret =
    process.env.SESSION_SECRET ||
    "dev-only-insecure-secret-please-set-SESSION_SECRET";
  return secret;
}

/* ---------- password hashing ---------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hash] = parts;
  const hashBuf = Buffer.from(hash, "hex");
  const testBuf = scryptSync(password, salt, 64);
  if (hashBuf.length !== testBuf.length) return false;
  return timingSafeEqual(hashBuf, testBuf);
}

/* ---------- session tokens ---------- */

import { createHmac } from "crypto";

function sign(payload: string): string {
  const hmac = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return hmac;
}

function makeToken(userId: string): string {
  const sig = sign(userId);
  return `${userId}.${sig}`;
}

function verifyToken(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(userId);
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;
  return userId;
}

/* ---------- cookie helpers (server-only) ---------- */

export async function setSessionCookie(userId: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, makeToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/* ---------- current user lookup ---------- */

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const userId = verifyToken(token);
    if (!userId) return null;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });
    return user ?? null;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "AuthError";
  }
}
