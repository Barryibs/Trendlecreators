import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Get the Monday of the week containing a date (UTC-based)
function getWeekStart(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().split("T")[0];
}

// Generate weeks from March 2, 2026 (first Monday on/after March 1) up to current week only
function generateWeeks(): { start: string; end: string; label: string }[] {
  const weeks: { start: string; end: string; label: string }[] = [];
  const now = new Date();
  // March 1, 2026 is a Sunday — first Monday is March 2
  const current = new Date("2026-03-02T00:00:00Z");

  while (current <= now) {
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const label = `${current.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    weeks.push({
      start: current.toISOString().split("T")[0],
      end: weekEnd.toISOString().split("T")[0],
      label,
    });
    current.setDate(current.getDate() + 7);
  }
  return weeks;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get("week"); // YYYY-MM-DD of week start

  // Date filter — default is all time from March 1
  const startDate = weekStart
    ? new Date(weekStart + "T00:00:00Z")
    : new Date("2026-03-01T00:00:00Z");
  const endDate = weekStart
    ? new Date(
        new Date(weekStart + "T00:00:00Z").getTime() + 7 * 24 * 60 * 60 * 1000
      )
    : new Date();

  const dateFilter = { gte: startDate, lte: endDate };

  const [creators, trendleMentions, allTweets] = await Promise.all([
    prisma.creator.findMany({
      include: {
        tweets: { where: { mentionsTrendle: true, postedAt: dateFilter } },
        interactions: {
          where: { detectedAt: dateFilter },
        },
      },
    }),
    prisma.tweet.count({
      where: { mentionsTrendle: true, postedAt: dateFilter },
    }),
    prisma.tweet.findMany({
      where: { mentionsTrendle: true, postedAt: dateFilter },
      include: {
        creator: {
          select: { username: true, displayName: true, profileImage: true },
        },
      },
      orderBy: { postedAt: "desc" },
      take: 20,
    }),
  ]);

  const totalImpressions = creators.reduce(
    (sum, c) => sum + c.tweets.reduce((s, t) => s + t.impressions, 0),
    0
  );

  const totalEngagement = creators.reduce(
    (sum, c) =>
      sum +
      c.tweets.reduce(
        (s, t) => s + t.likes + t.retweets + t.replies + t.quotes,
        0
      ),
    0
  );

  const topCreators = creators
    .map((c) => ({
      id: c.id,
      twitterId: c.twitterId,
      username: c.username,
      displayName: c.displayName,
      profileImage: c.profileImage,
      followerCount: c.followerCount,
      addedAt: c.addedAt.toISOString(),
      trendleMentions: c.tweets.length,
      totalImpressions: c.tweets.reduce((s, t) => s + t.impressions, 0),
      totalEngagement: c.tweets.reduce(
        (s, t) => s + t.likes + t.retweets + t.replies + t.quotes,
        0
      ),
      interactionCount: c.interactions.length,
    }))
    .sort((a, b) => b.totalImpressions - a.totalImpressions)
    .slice(0, 10);

  // Impressions over time — group by week
  const allMentionTweets = await prisma.tweet.findMany({
    where: {
      mentionsTrendle: true,
      postedAt: { gte: new Date("2026-03-01T00:00:00Z") },
    },
    orderBy: { postedAt: "asc" },
  });

  const impressionsByWeek = new Map<string, number>();
  for (const t of allMentionTweets) {
    const week = getWeekStart(t.postedAt);
    impressionsByWeek.set(
      week,
      (impressionsByWeek.get(week) || 0) + t.impressions
    );
  }

  const impressionsOverTime = Array.from(impressionsByWeek.entries())
    .filter(([week]) => week >= "2026-03-01")
    .map(([week, impressions]) => ({ date: week, impressions }));

  const weeks = generateWeeks();

  return NextResponse.json({
    totalCreators: creators.length,
    totalTrendleMentions: trendleMentions,
    totalImpressions,
    totalEngagement,
    recentMentions: allTweets.map((t) => ({
      id: t.id,
      tweetId: t.tweetId,
      text: t.text,
      postedAt: t.postedAt.toISOString(),
      impressions: t.impressions,
      likes: t.likes,
      retweets: t.retweets,
      creator: t.creator,
    })),
    topCreators,
    impressionsOverTime,
    weeks,
  });
}
