export type SafeClientError = {
  type: string;
  path: string;
  digest?: string;
};

const cleanToken = (value: unknown, fallback: string, limit: number) => {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/[^a-zA-Z0-9._/-]/g, "").slice(0, limit);
  return cleaned || fallback;
};

export function sanitizeClientError(input: unknown): SafeClientError {
  const record = input && typeof input === "object"
    ? input as Record<string, unknown>
    : {};
  const rawPath = typeof record.path === "string" && record.path.startsWith("/")
    ? record.path.split(/[?#]/, 1)[0]
    : "/";
  const safePath = /^\/teklif\/[0-9a-f-]+$/i.test(rawPath) ? "/teklif/:share" : rawPath;
  const digest = cleanToken(record.digest, "", 100);
  return {
    type: cleanToken(record.type, "ApplicationError", 64),
    path: cleanToken(safePath, "/", 200),
    ...(digest ? { digest } : {}),
  };
}

export function runtimeEnvironment() {
  return process.env.NEXT_PUBLIC_APP_ENV === "production"
    ? "production"
    : process.env.NEXT_PUBLIC_APP_ENV === "staging"
      ? "staging"
      : "development";
}
