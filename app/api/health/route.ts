import { runtimeEnvironment } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      status: "ok",
      service: "teklifio",
      environment: runtimeEnvironment(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
