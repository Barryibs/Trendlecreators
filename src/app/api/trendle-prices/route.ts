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

    // Fetch a full day of prices (1440 minutes) for both entry day and current day
    // to find the lowest entry price and highest current price (max profit scenario)
    const dayMinutes = 24 * 60;
    const entrySkip = daysBack * dayMinutes;

    const [currentDayRes, entryDayRes] = await Promise.all([
      fetch(
        `https://api.trendle.fi/trendle/markets/${market.id}/prices?version=v1&limit=${dayMinutes}`
      ),
      fetch(
        `https://api.trendle.fi/trendle/markets/${market.id}/prices?version=v1&limit=${dayMinutes}&skip=${entrySkip}`
      ),
    ]);

    if (!currentDayRes.ok || !entryDayRes.ok) {
      throw new Error("Failed to fetch prices");
    }

    const currentDayData: { value: string; timestamp: string }[] = await currentDayRes.json();
    const entryDayData: { value: string; timestamp: string }[] = await entryDayRes.json();

    if (!currentDayData.length || !entryDayData.length) {
      return NextResponse.json(
        { error: "No price data available" },
        { status: 404 }
      );
    }

    // Find lowest price on entry day and highest price on current day
    let entryPrice = Infinity;
    let entryTime = entryDayData[0].timestamp;
    for (const p of entryDayData) {
      const val = parseFloat(p.value);
      if (val < entryPrice) {
        entryPrice = val;
        entryTime = p.timestamp;
      }
    }

    let currentPrice = -Infinity;
    let currentTime = currentDayData[0].timestamp;
    for (const p of currentDayData) {
      const val = parseFloat(p.value);
      if (val > currentPrice) {
        currentPrice = val;
        currentTime = p.timestamp;
      }
    }

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
