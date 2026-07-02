import { getSessionUser } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail("Unauthorized", 401, "unauthorized");
  return ok({ user });
}
