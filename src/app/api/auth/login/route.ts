import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid JSON body", 400);

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return fail("Email and password are required", 422, "missing_credentials");
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return fail("Invalid email or password", 401, "invalid_credentials");
    }
    if (!verifyPassword(password, user.passwordHash)) {
      return fail("Invalid email or password", 401, "invalid_credentials");
    }

    await setSessionCookie(user.id);
    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
