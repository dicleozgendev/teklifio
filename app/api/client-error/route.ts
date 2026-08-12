import { runtimeEnvironment, sanitizeClientError } from "@/lib/observability";
import { consumeDistributedRateLimit, getFirebaseServerContext } from "@/lib/firebase/server-rest";

export async function POST(request: Request) {
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

  const authorization = request.headers.get("authorization");
  const idToken = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  if (!idToken) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let rateLimit;
  try {
    const context = await getFirebaseServerContext(idToken);
    rateLimit = await consumeDistributedRateLimit({ ...context, idToken, scope: "client-error", limit: 20, windowMs: 60_000 });
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!rateLimit.allowed) return Response.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });

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
