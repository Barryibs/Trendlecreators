import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MIN_PAYOUT = 200;
const MAX_PAYOUT = 500;

const PAYOUT_MONTH = "2026-03";

function getMonthRange(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

function getMonthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// Generate all months from Nov 2025 (earliest data) to current month
function getAllMonths(): string[] {
  const months: string[] = [];
  const now = new Date();
  const current = new Date(Date.UTC(2025, 10, 1)); // Nov 2025
  while (current <= now) {
    months.push(
      `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, "0")}`
    );
    current.setUTCMonth(current.getUTCMonth() + 1);
  }
  return months;
}

function computeScore(stats: {
  impressions: number;
  engagement: number;
  mentions: number;
  interactions: number;
  referrals: number;
  volume: number;
}) {
  return (
    stats.impressions * 10 +
    stats.mentions * 1000 +
    stats.engagement * 5 +
    stats.interactions * 200 +
    stats.referrals * 100 +
    stats.volume * 3
  );
}

export async function GET(req: NextRequest) {
  const creators = await prisma.creator.findMany({
    include: {
      tweets: true,
      interactions: true,
      referrals: true,
    },
  });

  const allMonths = getAllMonths();

  // Build monthly totals (program-wide)
  const monthlyTotals = allMonths.map((ym) => {
    const { start, end } = getMonthRange(ym);
    let impressions = 0;
    let engagement = 0;
    let mentions = 0;
    let interactions = 0;
    let referrals = 0;
    let volume = 0;

    for (const c of creators) {
      const tweets = c.tweets.filter(
        (t) => t.mentionsTrendle && t.postedAt >= start && t.postedAt < end
      );
      impressions += tweets.reduce((s, t) => s + t.impressions, 0);
      engagement += tweets.reduce(
        (s, t) => s + t.likes + t.retweets + t.replies + t.quotes,
        0
      );
      mentions += tweets.length;
      interactions += c.interactions.filter(
        (i) => i.detectedAt >= start && i.detectedAt < end
      ).length;
      const refs = c.referrals.filter(
        (r) => r.createdAt >= start && r.createdAt < end
      );
      referrals += refs.length;
      volume += refs.reduce((s, r) => s + r.tradingVolume, 0);
    }

    return {
      month: ym,
      label: getMonthLabel(ym),
      impressions,
      engagement,
      mentions,
      interactions,
      referrals,
      volume: Math.round(volume * 100) / 100,
      score: computeScore({
        impressions,
        engagement,
        mentions,
        interactions,
        referrals,
        volume,
      }),
    };
  });

  // Build per-creator monthly breakdown
  const creatorMonthly = creators.map((c) => {
    const months = allMonths.map((ym) => {
      const { start, end } = getMonthRange(ym);
      const tweets = c.tweets.filter(
        (t) => t.mentionsTrendle && t.postedAt >= start && t.postedAt < end
      );
      const ints = c.interactions.filter(
        (i) => i.detectedAt >= start && i.detectedAt < end
      );
      const refs = c.referrals.filter(
        (r) => r.createdAt >= start && r.createdAt < end
      );

      const impressions = tweets.reduce((s, t) => s + t.impressions, 0);
      const engagement = tweets.reduce(
        (s, t) => s + t.likes + t.retweets + t.replies + t.quotes,
        0
      );
      const mentionCount = tweets.length;
      const refVolume = refs.reduce((s, r) => s + r.tradingVolume, 0);

      return {
        month: ym,
        label: getMonthLabel(ym),
        impressions,
        engagement,
        mentions: mentionCount,
        interactions: ints.length,
        referrals: refs.length,
        volume: Math.round(refVolume * 100) / 100,
        score: computeScore({
          impressions,
          engagement,
          mentions: mentionCount,
          interactions: ints.length,
          referrals: refs.length,
          volume: refVolume,
        }),
      };
    });

    return {
      id: c.id,
      username: c.username,
      displayName: c.displayName,
      profileImage: c.profileImage,
      months,
    };
  });

  // Payout allocation for the payout month
  const { start: payStart, end: payEnd } = getMonthRange(PAYOUT_MONTH);

  const allocations = creators.map((c) => {
    const tweets = c.tweets.filter(
      (t) => t.mentionsTrendle && t.postedAt >= payStart && t.postedAt < payEnd
    );
    const ints = c.interactions.filter(
      (i) => i.detectedAt >= payStart && i.detectedAt < payEnd
    );
    const refs = c.referrals.filter(
      (r) => r.createdAt >= payStart && r.createdAt < payEnd
    );

    const totalImpressions = tweets.reduce((s, t) => s + t.impressions, 0);
    const totalEngagement = tweets.reduce(
      (s, t) => s + t.likes + t.retweets + t.replies + t.quotes,
      0
    );
    const referralVolume = refs.reduce((s, r) => s + r.tradingVolume, 0);

    const score = computeScore({
      impressions: totalImpressions,
      engagement: totalEngagement,
      mentions: tweets.length,
      interactions: ints.length,
      referrals: refs.length,
      volume: referralVolume,
    });

    return {
      id: c.id,
      username: c.username,
      displayName: c.displayName,
      profileImage: c.profileImage,
      followerCount: c.followerCount,
      totalTweets: c.tweets.filter(
        (t) => t.postedAt >= payStart && t.postedAt < payEnd
      ).length,
      trendleMentions: tweets.length,
      totalImpressions,
      totalEngagement,
      interactionCount: ints.length,
      referralCount: refs.length,
      referralVolume: Math.round(referralVolume * 100) / 100,
      score,
      payout: 0,
    };
  });

  const active = allocations.filter((a) => a.score > 0);
  const inactive = allocations.filter((a) => a.score === 0);

  // Normalize scores to 0-10 scale and compute payouts
  const maxScore = active.length > 0 ? Math.max(...active.map((a) => a.score)) : 0;
  const minScore = active.length > 0 ? Math.min(...active.map((a) => a.score)) : 0;

  if (active.length > 0) {
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
  }

  // Add score10 (0-10 scale) to each allocation
  const withScore10 = allocations.map((a) => ({
    ...a,
    score10:
      maxScore === 0
        ? 0
        : Math.round((a.score / maxScore) * 100) / 10,
  }));

  const sorted = [
    ...withScore10.filter((a) => a.score > 0).sort((a, b) => b.payout - a.payout),
    ...withScore10.filter((a) => a.score === 0).map((a) => ({ ...a, payout: 0 })),
  ];

  const totalAllocated = sorted.reduce((s, a) => s + a.payout, 0);

  return NextResponse.json({
    allocations: sorted,
    period: getMonthLabel(PAYOUT_MONTH),
    totalBudget: `$${MIN_PAYOUT}-$${MAX_PAYOUT} per creator`,
    totalAllocated,
    activeCreators: active.length,
    inactiveCreators: inactive.length,
    monthlyTotals,
    creatorMonthly: creatorMonthly.filter((c) =>
      c.months.some((m) => m.score > 0)
    ),
  });
}
