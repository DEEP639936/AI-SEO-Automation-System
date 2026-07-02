import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid JSON body", 400);

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim() || null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail("A valid email is required", 422, "invalid_email");
    }
    if (password.length < 8) {
      return fail("Password must be at least 8 characters", 422, "weak_password");
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return fail("An account with this email already exists", 409, "email_taken");
    }

    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash: hashPassword(password),
        role: "owner",
      },
      select: { id: true, email: true, name: true, role: true },
    });

    await setSessionCookie(user.id);
    return ok({ user });
  } catch (err) {
    return handleError(err);
  }
}
