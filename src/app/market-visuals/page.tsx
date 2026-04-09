"use client";

import { useState, useRef, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MARKETS = [
  "BTC", "ETH", "SOL", "SUI", "AVAX", "ARB", "DOGE", "PEPE",
  "WIF", "BONK", "JUP", "ONDO", "RENDER", "INJ", "TIA", "SEI",
  "LINK", "AAVE", "UNI", "OP",
];

const TIME_RANGES = [
  { label: "24H", days: "1" },
  { label: "7D", days: "7" },
  { label: "30D", days: "30" },
  { label: "90D", days: "90" },
];

interface MarketData {
  symbol: string;
  prices: { time: number; price: number }[];
  currentPrice: number;
  change24h: number;
  high: number;
  low: number;
  days: number;
}

function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(8)}`;
}

function formatAxis(price: number): string {
  if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
  if (price >= 1) return `$${price.toFixed(0)}`;
  if (price >= 0.01) return `$${price.toFixed(3)}`;
  return `$${price.toFixed(6)}`;
}

export default function MarketVisualsPage() {
  const [selectedMarket, setSelectedMarket] = useState("BTC");
  const [selectedRange, setSelectedRange] = useState("7");
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async (symbol: string, days: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market-data?symbol=${symbol}&days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMarketData(data);
    } catch {
      setError("Failed to load market data. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerate = () => {
    fetchData(selectedMarket, selectedRange);
  };

  const handleDownload = async () => {
    if (!chartRef.current) return;
    const html2canvas = (await import("html2canvas-pro")).default;
    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: "#0f172a",
      scale: 2,
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = `${selectedMarket}-chart-trendle.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopyImage = async () => {
    if (!chartRef.current) return;
    const html2canvas = (await import("html2canvas-pro")).default;
    const canvas = await html2canvas(chartRef.current, {
      backgroundColor: "#0f172a",
      scale: 2,
      useCORS: true,
    });
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        alert("Image copied to clipboard!");
      } catch {
        alert("Copy failed. Try downloading instead.");
      }
    }, "image/png");
  };

  const isPositive = marketData ? marketData.change24h >= 0 : true;
  const rangeLabel = TIME_RANGES.find((t) => t.days === selectedRange)?.label ?? "7D";
  const tradeUrl = `https://trendle.fi`;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Market Visuals</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Generate branded chart visuals to share under tweets with a link to trade on Trendle.
      </p>

      {/* Controls */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Market</label>
            <div className="flex flex-wrap gap-2">
              {MARKETS.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMarket(m)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedMarket === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-border"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Time Range</label>
            <div className="flex gap-2">
              {TIME_RANGES.map((t) => (
                <button
                  key={t.days}
                  onClick={() => setSelectedRange(t.days)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedRange === t.days
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-border"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="self-start px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Visual"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Chart Preview */}
      {marketData && (
        <>
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
            >
              Download PNG
            </button>
            <button
              onClick={handleCopyImage}
              className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-muted"
            >
              Copy to Clipboard
            </button>
          </div>

          {/* The exportable visual */}
          <div
            ref={chartRef}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
              padding: "32px",
              maxWidth: "680px",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <span style={{ color: "#ffffff", fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px" }}>
                    {marketData.symbol}/USD
                  </span>
                  <span
                    style={{
                      color: isPositive ? "#22c55e" : "#ef4444",
                      fontSize: "16px",
                      fontWeight: 600,
                      backgroundColor: isPositive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      padding: "2px 10px",
                      borderRadius: "8px",
                    }}
                  >
                    {isPositive ? "+" : ""}{marketData.change24h.toFixed(2)}%
                  </span>
                </div>
                <span style={{ color: "#ffffff", fontSize: "32px", fontWeight: 700 }}>
                  {formatPrice(marketData.currentPrice)}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "2px" }}>{rangeLabel} Range</div>
                <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                  H: {formatPrice(marketData.high)}
                </div>
                <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                  L: {formatPrice(marketData.low)}
                </div>
              </div>
            </div>

            {/* Chart */}
            <div style={{ marginBottom: "20px" }}>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={marketData.prices}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={(t) => {
                      const d = new Date(t);
                      return marketData.days <= 1
                        ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    }}
                    axisLine={{ stroke: "rgba(148,163,184,0.2)" }}
                    tickLine={false}
                    minTickGap={40}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={formatAxis}
                    axisLine={false}
                    tickLine={false}
                    domain={["auto", "auto"]}
                    width={65}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [formatPrice(Number(value)), "Price"]}
                    labelFormatter={(t) => {
                      const d = new Date(t);
                      return d.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      });
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isPositive ? "#22c55e" : "#ef4444"}
                    strokeWidth={2}
                    fill="url(#chartGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Footer with Trendle branding and trade link */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid rgba(148,163,184,0.15)",
                paddingTop: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #6366f1, #818cf8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    color: "#fff",
                    fontSize: "14px",
                  }}
                >
                  T
                </div>
                <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "16px" }}>
                  Trendle
                </span>
                <span style={{ color: "#64748b", fontSize: "13px" }}>
                  Perpetual DEX
                </span>
              </div>
              <div
                style={{
                  background: "linear-gradient(135deg, #6366f1, #818cf8)",
                  padding: "6px 16px",
                  borderRadius: "8px",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                Trade on trendle.fi
              </div>
            </div>
          </div>

          {/* Trade link for copy */}
          <div className="mt-4 bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground mb-2">Copy this text to accompany your image:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-lg">
                Trade ${selectedMarket} on @trendlefi {tradeUrl}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Trade $${selectedMarket} on @trendlefi ${tradeUrl}`
                  );
                  alert("Copied!");
                }}
                className="px-3 py-2 bg-muted rounded-lg text-sm font-medium hover:bg-border"
              >
                Copy
              </button>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!marketData && !loading && !error && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">
            Select a market and time range, then click &quot;Generate Visual&quot; to create a shareable chart image.
          </p>
        </div>
      )}
    </div>
  );
}
