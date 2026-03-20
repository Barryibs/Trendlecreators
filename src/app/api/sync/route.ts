import { NextRequest, NextResponse } from "next/server";
import { runFullSync } from "@/lib/sync";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  // Verify sync secret (skip in development)
  const secret = request.headers.get("x-sync-secret");
  if (
    process.env.NODE_ENV === "production" &&
    secret !== process.env.SYNC_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await runFullSync();

    const lastLogs = await prisma.syncLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ success: true, logs: lastLogs });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

export async function GET() {
  const lastLogs = await prisma.syncLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(lastLogs);
}
