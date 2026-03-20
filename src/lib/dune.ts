import { DuneClient } from "@duneanalytics/client-sdk";

const DUNE_API_KEY = process.env.DUNE_API_KEY || "26nQzs0RZ69rl0JL9rYAjvAXgXOKHTkm";
const TRADING_QUERY_ID = 6868863;

let client: DuneClient | null = null;

function getDuneClient(): DuneClient {
  if (!client) {
    client = new DuneClient(DUNE_API_KEY);
  }
  return client;
}

export interface TraderMetrics {
  trader: string;
  total_volume: number;
  total_trading_fees: number;
  total_holding_fees: number;
  total_imbalance_fees: number;
  total_funding_fees_paid: number;
  total_trades: number;
  first_trade: string | null;
  last_trade: string | null;
}

// Cache to avoid re-fetching on every request
let metricsCache: Map<string, TraderMetrics> | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getAllTraderMetrics(): Promise<Map<string, TraderMetrics>> {
  if (metricsCache && Date.now() - cacheTime < CACHE_TTL) {
    return metricsCache;
  }

  const dune = getDuneClient();
  const result = await dune.getLatestResult({ queryId: TRADING_QUERY_ID });
  const rows = result.result?.rows || [];

  const map = new Map<string, TraderMetrics>();
  for (const row of rows) {
    const trader = (row.trader as string).toLowerCase();
    map.set(trader, {
      trader,
      total_volume: Number(row.total_volume) || 0,
      total_trading_fees: Number(row.total_trading_fees) || 0,
      total_holding_fees: Number(row.total_holding_fees) || 0,
      total_imbalance_fees: Number(row.total_imbalance_fees) || 0,
      total_funding_fees_paid: Number(row.total_funding_fees_paid) || 0,
      total_trades: Number(row.total_trades) || 0,
      first_trade: (row.first_trade as string) || null,
      last_trade: (row.last_trade as string) || null,
    });
  }

  metricsCache = map;
  cacheTime = Date.now();
  return map;
}

export async function getMetricsForWallets(
  wallets: string[]
): Promise<TraderMetrics[]> {
  const allMetrics = await getAllTraderMetrics();
  return wallets
    .map((w) => allMetrics.get(w.toLowerCase()))
    .filter((m): m is TraderMetrics => m !== undefined);
}

export async function getMetricsForWallet(
  wallet: string
): Promise<TraderMetrics | null> {
  const allMetrics = await getAllTraderMetrics();
  return allMetrics.get(wallet.toLowerCase()) || null;
}
