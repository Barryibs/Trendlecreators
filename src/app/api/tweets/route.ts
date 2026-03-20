import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const tweets = await prisma.trendleTweet.findMany({
    include: {
      interactions: {
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              profileImage: true,
            },
          },
        },
      },
    },
    orderBy: { postedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(tweets);
}
