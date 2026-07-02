/**
 * Thin fetch wrapper for the browser. Throws an Error with a `.status` and
 * `.code` on non-2xx so React Query / mutations can react.
 */
export class ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code = "error") {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : null) ?? `Request failed (${res.status})`;
    const code =
      (data && typeof data === "object" && "code" in data
        ? String((data as { code: unknown }).code)
        : "error") ?? "error";
    throw new ApiError(msg, res.status, code);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
