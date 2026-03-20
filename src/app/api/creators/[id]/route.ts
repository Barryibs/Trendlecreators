import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const creator = await prisma.creator.findUnique({
    where: { id },
    include: {
      tweets: {
        where: { mentionsTrendle: true },
        orderBy: { postedAt: "desc" },
      },
    },
  });

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  // For quote tweets, fetch the quoted Trendle tweet text
  const quotedTweetIds = creator.tweets
    .filter((t) => t.isQuoteTweet && t.quotedTweetId)
    .map((t) => t.quotedTweetId!);

  const quotedTweets =
    quotedTweetIds.length > 0
      ? await prisma.trendleTweet.findMany({
          where: { tweetId: { in: quotedTweetIds } },
          select: { tweetId: true, text: true, postedAt: true },
        })
      : [];

  const quotedTweetMap = new Map(
    quotedTweets.map((t) => [t.tweetId, t])
  );

  const tweetsWithQuotes = creator.tweets.map((t) => ({
    ...t,
    quotedTrendle:
      t.isQuoteTweet && t.quotedTweetId
        ? quotedTweetMap.get(t.quotedTweetId) || null
        : null,
  }));

  return NextResponse.json({
    ...creator,
    tweets: tweetsWithQuotes,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.creator.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }
}
