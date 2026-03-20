import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAllTraderMetrics } from "@/lib/dune";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const creator = await prisma.creator.findUnique({
    where: { id },
    include: {
      referrals: true,
    },
  });

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  // Fetch Dune trading metrics for all wallets
  let allMetrics;
  try {
    allMetrics = await getAllTraderMetrics();
  } catch {
    allMetrics = new Map();
  }

  // Get creator's own metrics
  const creatorMetrics = creator.walletAddress
    ? allMetrics.get(creator.walletAddress.toLowerCase()) || null
    : null;

  // Get metrics for each referral
  const referralsWithMetrics = creator.referrals.map((r) => {
    const metrics = allMetrics.get(r.walletAddress.toLowerCase());
    return {
      id: r.id,
      walletAddress: r.walletAddress,
      createdAt: r.createdAt.toISOString(),
      volume: metrics?.total_volume || 0,
      tradingFees: metrics?.total_trading_fees || 0,
      holdingFees: metrics?.total_holding_fees || 0,
      imbalanceFees: metrics?.total_imbalance_fees || 0,
      fundingFees: metrics?.total_funding_fees_paid || 0,
      totalTrades: metrics?.total_trades || 0,
      firstTrade: metrics?.first_trade || null,
      lastTrade: metrics?.last_trade || null,
      isActive: (metrics?.total_trades || 0) > 0,
    };
  });

  // Aggregate totals
  const totalReferrals = referralsWithMetrics.length;
  const activeReferrals = referralsWithMetrics.filter((r) => r.isActive).length;
  const totalReferredVolume = referralsWithMetrics.reduce(
    (s, r) => s + r.volume,
    0
  );
  const totalReferredFees = referralsWithMetrics.reduce(
    (s, r) => s + r.tradingFees + r.holdingFees + r.imbalanceFees,
    0
  );
  const totalReferredFundingFees = referralsWithMetrics.reduce(
    (s, r) => s + r.fundingFees,
    0
  );
  const totalReferredTrades = referralsWithMetrics.reduce(
    (s, r) => s + r.totalTrades,
    0
  );

  return NextResponse.json({
    creatorMetrics: creatorMetrics
      ? {
          volume: creatorMetrics.total_volume,
          tradingFees: creatorMetrics.total_trading_fees,
          holdingFees: creatorMetrics.total_holding_fees,
          imbalanceFees: creatorMetrics.total_imbalance_fees,
          fundingFees: creatorMetrics.total_funding_fees_paid,
          totalTrades: creatorMetrics.total_trades,
          firstTrade: creatorMetrics.first_trade,
          lastTrade: creatorMetrics.last_trade,
        }
      : null,
    summary: {
      totalReferrals,
      activeReferrals,
      totalReferredVolume,
      totalReferredFees,
      totalReferredFundingFees,
      totalReferredTrades,
    },
    referrals: referralsWithMetrics.sort((a, b) => b.volume - a.volume),
  });
}
