import { getPayloadClient } from "@/server/payload/get-payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const responseHeaders = {
  "Cache-Control": "no-store",
};

export async function GET() {
  try {
    const payload = await getPayloadClient();
    await payload.db.pool.query("SELECT 1");

    return Response.json(
      { status: "ready", database: "reachable" },
      { headers: responseHeaders },
    );
  } catch {
    return Response.json(
      { status: "unavailable", database: "unreachable" },
      { headers: responseHeaders, status: 503 },
    );
  }
}
