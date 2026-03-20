import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const events = await prisma.timelineEvent.findMany({
    orderBy: { date: "asc" },
  });
  return NextResponse.json(events);
}
