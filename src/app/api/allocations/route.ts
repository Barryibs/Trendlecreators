import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MIN_PAYOUT = 200;
const MAX_PAYOUT = 500;

// March 2026 only
const PERIOD_START = new Date("2026-03-01T00:00:00Z");
const PERIOD_END = new Date("2026-04-01T00:00:00Z");
const PERIOD_LABEL = "March 2026";

export async function GET() {
  const creators = await prisma.creator.findMany({
    include: {
      tweets: {
        where: {
          postedAt: { gte: PERIOD_START, lt: PERIOD_END },
        },
      },
      interactions: {
        where: {
          detectedAt: { gte: PERIOD_START, lt: PERIOD_END },
        },
      },
      referrals: {
        where: {
          createdAt: { gte: PERIOD_START, lt: PERIOD_END },
        },
      },
    },
  });

  const allocations = creators.map((c) => {
    const trendlePosts = c.tweets.filter((t) => t.mentionsTrendle);
    const totalTweets = c.tweets.length;
    const trendleMentions = trendlePosts.length;
    const totalImpressions = trendlePosts.reduce(
      (s, t) => s + t.impressions,
      0
    );
    const totalEngagement = trendlePosts.reduce(
      (s, t) => s + t.likes + t.retweets + t.replies + t.quotes,
      0
    );
    const interactionCount = c.interactions.length;
    const referralCount = c.referrals.length;
    const referralVolume = c.referrals.reduce(
      (s, r) => s + r.tradingVolume,
      0
    );

    const score =
      totalImpressions * 1 +
      totalEngagement * 10 +
      trendleMentions * 500 +
      interactionCount * 200 +
      referralCount * 100 +
      referralVolume * 5;

    return {
      id: c.id,
      username: c.username,
      displayName: c.displayName,
      profileImage: c.profileImage,
      followerCount: c.followerCount,
      totalTweets,
      trendleMentions,
      totalImpressions,
      totalEngagement,
      interactionCount,
      referralCount,
      referralVolume: Math.round(referralVolume * 100) / 100,
      score,
      payout: 0,
    };
  });

  const active = allocations.filter((a) => a.score > 0);
  const inactive = allocations.filter((a) => a.score === 0);

  if (active.length === 0) {
    return NextResponse.json({
      allocations: allocations.map((a) => ({ ...a, payout: 0 })),
      period: PERIOD_LABEL,
      totalBudget: 0,
      totalAllocated: 0,
      activeCreators: 0,
      inactiveCreators: allocations.length,
    });
  }

  const maxScore = Math.max(...active.map((a) => a.score));
  const minScore = Math.min(...active.map((a) => a.score));

  for (const a of active) {
    if (maxScore === minScore) {
      a.payout = Math.round((MIN_PAYOUT + MAX_PAYOUT) / 2);
    } else {
      const normalized = (a.score - minScore) / (maxScore - minScore);
      a.payout = Math.round(
        MIN_PAYOUT + normalized * (MAX_PAYOUT - MIN_PAYOUT)
      );
    }
  }

  const sorted = [
    ...active.sort((a, b) => b.payout - a.payout),
    ...inactive.map((a) => ({ ...a, payout: 0 })),
  ];

  const totalAllocated = sorted.reduce((s, a) => s + a.payout, 0);

  return NextResponse.json({
    allocations: sorted,
    period: PERIOD_LABEL,
    totalBudget: `$${MIN_PAYOUT}-$${MAX_PAYOUT} per creator`,
    totalAllocated,
    activeCreators: active.length,
    inactiveCreators: inactive.length,
  });
}
