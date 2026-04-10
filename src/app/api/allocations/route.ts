import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MAX_PAYOUT = 500;

// Lower-tier creators get $200 min, everyone else gets $300 min
const LOWER_TIER_USERNAMES = ["0xRyderr", "0xMegamus", "0xvinhpham"];
// forze never receives a payout
const EXCLUDED_USERNAMES = ["byforze"];

function getMinPayout(username: string): number {
  if (EXCLUDED_USERNAMES.includes(username)) return 0;
  if (LOWER_TIER_USERNAMES.includes(username)) return 200;
  return 300;
}

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

function getAllMonths(): string[] {
  const months: string[] = [];
  const now = new Date();
  const current = new Date(Date.UTC(2025, 10, 1));
  while (current <= now) {
    months.push(
      `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, "0")}`
    );
    current.setUTCMonth(current.getUTCMonth() + 1);
  }
  return months;
}

// Payout months (months where we actually pay creators)
function getPayoutMonths(): string[] {
  return getAllMonths().filter((ym) => ym >= "2026-03");
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

interface CreatorData {
  id: string;
  username: string;
  displayName: string;
  profileImage: string | null;
  followerCount: number;
  tweets: { mentionsTrendle: boolean; postedAt: Date; impressions: number; likes: number; retweets: number; replies: number; quotes: number }[];
  interactions: { detectedAt: Date }[];
  referrals: { createdAt: Date; tradingVolume: number }[];
}

function computeMonthAllocation(
  creators: CreatorData[],
  yearMonth: string
) {
  const { start, end } = getMonthRange(yearMonth);

  const allocations = creators.map((c) => {
    const isExcluded = EXCLUDED_USERNAMES.includes(c.username);
    const tweets = c.tweets.filter(
      (t) => t.mentionsTrendle && t.postedAt >= start && t.postedAt < end
    );
    const ints = c.interactions.filter(
      (i) => i.detectedAt >= start && i.detectedAt < end
    );
    const refs = c.referrals.filter(
      (r) => r.createdAt >= start && r.createdAt < end
    );

    const totalImpressions = tweets.reduce((s, t) => s + t.impressions, 0);
    const totalEngagement = tweets.reduce(
      (s, t) => s + t.likes + t.retweets + t.replies + t.quotes, 0
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

    const eligible = !isExcluded && score > 0;

    return {
      id: c.id,
      username: c.username,
      displayName: c.displayName,
      profileImage: c.profileImage,
      followerCount: c.followerCount,
      totalTweets: c.tweets.filter((t) => t.postedAt >= start && t.postedAt < end).length,
      trendleMentions: tweets.length,
      totalImpressions,
      totalEngagement,
      interactionCount: ints.length,
      referralCount: refs.length,
      referralVolume: Math.round(referralVolume * 100) / 100,
      score,
      isExcluded,
      isEligible: eligible,
      payout: 0,
      score10: 0,
    };
  });

  const eligible = allocations.filter((a) => a.isEligible);
  const maxScore = eligible.length > 0 ? Math.max(...eligible.map((a) => a.score)) : 0;
  const minScore = eligible.length > 0 ? Math.min(...eligible.map((a) => a.score)) : 0;

  for (const a of eligible) {
    const minPay = getMinPayout(a.username);
    if (maxScore === minScore) {
      a.payout = Math.round((minPay + MAX_PAYOUT) / 2);
    } else {
      const normalized = (a.score - minScore) / (maxScore - minScore);
      a.payout = Math.round(minPay + normalized * (MAX_PAYOUT - minPay));
    }
  }

  // Score out of 10
  for (const a of allocations) {
    a.score10 = maxScore === 0 ? 0 : Math.round((a.score / maxScore) * 100) / 10;
  }

  const sorted = [
    ...allocations.filter((a) => a.isEligible).sort((a, b) => b.payout - a.payout),
    ...allocations.filter((a) => !a.isEligible).sort((a, b) => b.score - a.score),
  ];

  return sorted;
}

export async function GET(req: NextRequest) {
  const creators = await prisma.creator.findMany({
    include: { tweets: true, interactions: true, referrals: true },
  });

  const allMonths = getAllMonths();
  const payoutMonths = getPayoutMonths();

  // Program-wide monthly totals
  const monthlyTotals = allMonths.map((ym) => {
    const { start, end } = getMonthRange(ym);
    let impressions = 0, engagement = 0, mentions = 0, interactions = 0, referrals = 0, volume = 0;
    for (const c of creators) {
      const tweets = c.tweets.filter((t) => t.mentionsTrendle && t.postedAt >= start && t.postedAt < end);
      impressions += tweets.reduce((s, t) => s + t.impressions, 0);
      engagement += tweets.reduce((s, t) => s + t.likes + t.retweets + t.replies + t.quotes, 0);
      mentions += tweets.length;
      interactions += c.interactions.filter((i) => i.detectedAt >= start && i.detectedAt < end).length;
      const refs = c.referrals.filter((r) => r.createdAt >= start && r.createdAt < end);
      referrals += refs.length;
      volume += refs.reduce((s, r) => s + r.tradingVolume, 0);
    }
    return {
      month: ym, label: getMonthLabel(ym),
      impressions, engagement, mentions, interactions, referrals,
      volume: Math.round(volume * 100) / 100,
      score: computeScore({ impressions, engagement, mentions, interactions, referrals, volume }),
    };
  });

  // Per-creator monthly performance
  const creatorMonthly = creators.map((c) => {
    const months = allMonths.map((ym) => {
      const { start, end } = getMonthRange(ym);
      const tweets = c.tweets.filter((t) => t.mentionsTrendle && t.postedAt >= start && t.postedAt < end);
      const ints = c.interactions.filter((i) => i.detectedAt >= start && i.detectedAt < end);
      const refs = c.referrals.filter((r) => r.createdAt >= start && r.createdAt < end);
      const impressions = tweets.reduce((s, t) => s + t.impressions, 0);
      const engagement = tweets.reduce((s, t) => s + t.likes + t.retweets + t.replies + t.quotes, 0);
      const refVolume = refs.reduce((s, r) => s + r.tradingVolume, 0);
      return {
        month: ym, label: getMonthLabel(ym), impressions, engagement,
        mentions: tweets.length, interactions: ints.length,
        referrals: refs.length, volume: Math.round(refVolume * 100) / 100,
        score: computeScore({ impressions, engagement, mentions: tweets.length, interactions: ints.length, referrals: refs.length, volume: refVolume }),
      };
    });
    return { id: c.id, username: c.username, displayName: c.displayName, profileImage: c.profileImage, months };
  });

  // Compute payouts for each payout month
  const monthlyPayouts = payoutMonths.map((ym) => {
    const allocs = computeMonthAllocation(creators as CreatorData[], ym);
    const total = allocs.reduce((s, a) => s + a.payout, 0);
    return {
      month: ym,
      label: getMonthLabel(ym),
      totalPayout: total,
      eligibleCount: allocs.filter((a) => a.payout > 0).length,
      creatorPayouts: allocs.map((a) => ({
        username: a.username,
        displayName: a.displayName,
        payout: a.payout,
        score10: a.score10,
        isEligible: a.isEligible,
      })),
    };
  });

  // Current month allocation (latest payout month) for the detailed table
  const latestPayoutMonth = payoutMonths[payoutMonths.length - 1] || "2026-03";
  const currentAllocations = computeMonthAllocation(creators as CreatorData[], latestPayoutMonth);
  const totalAllocated = currentAllocations.reduce((s, a) => s + a.payout, 0);
  const eligible = currentAllocations.filter((a) => a.payout > 0);

  return NextResponse.json({
    allocations: currentAllocations,
    period: getMonthLabel(latestPayoutMonth),
    totalBudget: "$200-$500 per creator",
    totalAllocated,
    eligibleCreators: eligible.length,
    ineligibleCreators: currentAllocations.length - eligible.length,
    monthlyTotals,
    creatorMonthly: creatorMonthly.filter((c) => c.months.some((m) => m.score > 0)),
    monthlyPayouts,
  });
}
