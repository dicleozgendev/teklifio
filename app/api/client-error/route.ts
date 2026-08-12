import { runtimeEnvironment, sanitizeClientError } from "@/lib/observability";
import { consumeRateLimit, requestRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit(await requestRateLimitKey(request, "client-error"), {
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 2048) {
    return Response.json({ error: "Payload too large" }, { status: 413 });
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const report = sanitizeClientError(body);
  console.error(JSON.stringify({
    level: "error",
    message: "client_error",
    route: "/api/client-error",
    requestId: request.headers.get("x-vercel-id") ?? undefined,
    environment: runtimeEnvironment(),
    ...report,
  }));
  return new Response(null, { status: 204 });
}
