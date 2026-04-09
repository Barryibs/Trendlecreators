import { NextRequest, NextResponse } from "next/server";

interface TrendleMarket {
  id: number;
  title: string;
  slug: string;
}

let marketsCache: TrendleMarket[] | null = null;
let marketsCacheTime = 0;

async function getMarkets(): Promise<TrendleMarket[]> {
  if (marketsCache && Date.now() - marketsCacheTime < 300000) {
    return marketsCache;
  }
  const res = await fetch("https://api.trendle.fi/trendle/markets");
  if (!res.ok) throw new Error("Failed to fetch markets");
  const data = await res.json();
  marketsCache = data.map((m: TrendleMarket) => ({
    id: m.id,
    title: m.title,
    slug: m.slug,
  }));
  marketsCacheTime = Date.now();
  return marketsCache!;
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const daysBack = parseInt(req.nextUrl.searchParams.get("days") || "7");

  try {
    const markets = await getMarkets();

    // If no slug, return market list
    if (!slug) {
      return NextResponse.json({ markets });
    }

    const market = markets.find((m) => m.slug === slug);
    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    // Fetch current price and historical price
    const skip = daysBack * 24 * 60; // 1-minute intervals

    const [currentRes, historicalRes] = await Promise.all([
      fetch(
        `https://api.trendle.fi/trendle/markets/${market.id}/prices?version=v1&limit=1`
      ),
      fetch(
        `https://api.trendle.fi/trendle/markets/${market.id}/prices?version=v1&limit=1&skip=${skip}`
      ),
    ]);

    if (!currentRes.ok || !historicalRes.ok) {
      throw new Error("Failed to fetch prices");
    }

    const currentData = await currentRes.json();
    const historicalData = await historicalRes.json();

    if (!currentData.length || !historicalData.length) {
      return NextResponse.json(
        { error: "No price data available" },
        { status: 404 }
      );
    }

    const currentPrice = parseFloat(currentData[0].value);
    const entryPrice = parseFloat(historicalData[0].value);
    const entryTime = historicalData[0].timestamp;
    const currentTime = currentData[0].timestamp;

    return NextResponse.json({
      market: {
        id: market.id,
        title: market.title,
        slug: market.slug,
      },
      entryPrice,
      currentPrice,
      entryTime,
      currentTime,
      priceChange: ((currentPrice - entryPrice) / entryPrice) * 100,
    });
  } catch (err) {
    console.error("Trendle prices error:", err);
    return NextResponse.json(
      { error: "Failed to fetch price data" },
      { status: 500 }
    );
  }
}
