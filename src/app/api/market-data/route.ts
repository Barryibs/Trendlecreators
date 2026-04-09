import { NextRequest, NextResponse } from "next/server";

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  SUI: "sui",
  AVAX: "avalanche-2",
  ARB: "arbitrum",
  DOGE: "dogecoin",
  PEPE: "pepe",
  WIF: "dogwifcoin",
  BONK: "bonk",
  JUP: "jupiter-exchange-solana",
  ONDO: "ondo-finance",
  RENDER: "render-token",
  INJ: "injective-protocol",
  TIA: "celestia",
  SEI: "sei-network",
  LINK: "chainlink",
  AAVE: "aave",
  UNI: "uniswap",
  OP: "optimism",
};

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.toUpperCase() ?? "BTC";
  const days = req.nextUrl.searchParams.get("days") ?? "7";

  const coinId = COINGECKO_IDS[symbol];
  if (!coinId) {
    return NextResponse.json(
      { error: `Unknown symbol: ${symbol}` },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&precision=2`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) {
      throw new Error(`CoinGecko API returned ${res.status}`);
    }

    const data = await res.json();

    const prices: { time: number; price: number }[] = data.prices.map(
      ([time, price]: [number, number]) => ({ time, price })
    );

    const currentPrice = prices[prices.length - 1]?.price ?? 0;
    const startPrice = prices[0]?.price ?? 0;
    const change24h =
      startPrice > 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0;
    const high = Math.max(...prices.map((p) => p.price));
    const low = Math.min(...prices.map((p) => p.price));

    return NextResponse.json({
      symbol,
      prices,
      currentPrice,
      change24h,
      high,
      low,
      days: Number(days),
    });
  } catch (err) {
    console.error("Market data fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}
