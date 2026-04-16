"use client";

import { useState, useEffect, useRef } from "react";

interface Market {
  id: number;
  title: string;
  slug: string;
}

interface PriceData {
  market: Market;
  entryPrice: number;
  currentPrice: number;
  entryTime: string;
  currentTime: string;
  priceChange: number;
}

const TIME_OPTIONS = [
  { label: "1 Day", days: 1 },
  { label: "3 Days", days: 3 },
  { label: "7 Days", days: 7 },
  { label: "14 Days", days: 14 },
  { label: "30 Days", days: 30 },
];

const LEVERAGE_OPTIONS = [1, 2, 3, 4, 5, 10];

const AMOUNT_PRESETS = [10, 25, 50, 100, 250, 500];

export default function CalculatorPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [days, setDays] = useState(7);
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [leverage, setLeverage] = useState(2);
  const [amount, setAmount] = useState(100);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [marketsLoading, setMarketsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Load markets on mount
  useEffect(() => {
    fetch("/api/trendle-prices")
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data.markets as Market[]).filter(
          (m) =>
            !["kkkkkkkkakrkfoakreofkokfrpakepaofkpok", "moltbook", "the-7-wanderers", "doctor-pigeon"].includes(m.slug)
        );
        setMarkets(filtered);
        if (filtered.length) setSelectedSlug(filtered[0].slug);
      })
      .catch(console.error)
      .finally(() => setMarketsLoading(false));
  }, []);

  const handleCalculate = async () => {
    if (!selectedSlug) return;
    setLoading(true);
    setPriceData(null);
    try {
      const res = await fetch(
        `/api/trendle-prices?slug=${selectedSlug}&days=${days}`
      );
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPriceData(data);
    } catch {
      alert("Failed to fetch price data. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate PnL
  const pnl = priceData
    ? (() => {
        const pctMove =
          ((priceData.currentPrice - priceData.entryPrice) /
            priceData.entryPrice) *
          100;
        const effectiveMove =
          direction === "long" ? pctMove : -pctMove;
        const returnPct = effectiveMove * leverage;
        const profit = (amount * returnPct) / 100;
        const finalAmount = amount + profit;
        const isLiquidated = returnPct <= -100;
        return {
          pctMove,
          effectiveMove,
          returnPct,
          profit: isLiquidated ? -amount : profit,
          finalAmount: isLiquidated ? 0 : finalAmount,
          isProfit: !isLiquidated && profit >= 0,
          isLiquidated,
        };
      })()
    : null;

  const captureCard = async () => {
    if (!resultRef.current) return null;
    const html2canvas = (await import("html2canvas-pro")).default;
    const el = resultRef.current;
    // Temporarily remove border-radius to avoid white corner artifacts
    const origRadius = el.style.borderRadius;
    el.style.borderRadius = "0px";
    const canvas = await html2canvas(el, {
      backgroundColor: "#1a1a1a",
      scale: 4,
      useCORS: true,
    });
    el.style.borderRadius = origRadius;
    // Draw rounded corners by clipping
    const radius = 20 * 4; // match scale
    const w = canvas.width;
    const h = canvas.height;
    const outCanvas = document.createElement("canvas");
    outCanvas.width = w;
    outCanvas.height = h;
    const ctx = outCanvas.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(w - radius, 0);
    ctx.quadraticCurveTo(w, 0, w, radius);
    ctx.lineTo(w, h - radius);
    ctx.quadraticCurveTo(w, h, w - radius, h);
    ctx.lineTo(radius, h);
    ctx.quadraticCurveTo(0, h, 0, h - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(canvas, 0, 0);
    return outCanvas;
  };

  const handleDownload = async () => {
    const canvas = await captureCard();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `trendle-pnl-${selectedSlug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopyImage = async () => {
    const canvas = await captureCard();
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        alert("Copy failed. Try downloading instead.");
      }
    }, "image/png");
  };

  const selectedMarket = markets.find((m) => m.slug === selectedSlug);
  const timeLabel = TIME_OPTIONS.find((t) => t.days === days)?.label ?? `${days}D`;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">What Would You Have Made?</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Pick a trending topic, choose your direction and leverage, and see what you would have made trading attention on Trendle.
      </p>

      {/* Calculator controls */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="flex flex-col gap-5">
          {/* Market selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Pick a Market
            </label>
            {marketsLoading ? (
              <p className="text-sm text-muted-foreground">Loading markets...</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {markets.map((m) => (
                  <button
                    key={m.slug}
                    onClick={() => {
                      setSelectedSlug(m.slug);
                      setPriceData(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedSlug === m.slug
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-border"
                    }`}
                  >
                    {m.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Time range */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Time Period
            </label>
            <div className="flex gap-2">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.days}
                  onClick={() => {
                    setDays(t.days);
                    setPriceData(null);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    days === t.days
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-border"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Direction */}
          <div>
            <label className="text-sm font-medium mb-2 block">Direction</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDirection("long");
                  setPriceData(null);
                }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  direction === "long"
                    ? "bg-green-500 text-white"
                    : "bg-muted hover:bg-border"
                }`}
              >
                Long (Up)
              </button>
              <button
                onClick={() => {
                  setDirection("short");
                  setPriceData(null);
                }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  direction === "short"
                    ? "bg-red-500 text-white"
                    : "bg-muted hover:bg-border"
                }`}
              >
                Short (Down)
              </button>
            </div>
          </div>

          {/* Leverage */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Leverage
            </label>
            <div className="flex gap-2">
              {LEVERAGE_OPTIONS.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLeverage(l);
                    setPriceData(null);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    leverage === l
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-border"
                  }`}
                >
                  {l}x
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Trade Amount ($)
            </label>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {AMOUNT_PRESETS.map((a) => (
                  <button
                    key={a}
                    onClick={() => {
                      setAmount(a);
                      setPriceData(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      amount === a
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-border"
                    }`}
                  >
                    ${a}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(Number(e.target.value) || 0);
                  setPriceData(null);
                }}
                className="w-24 px-3 py-1.5 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                min={1}
              />
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={loading || !selectedSlug}
            className="self-start px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Calculating..." : "Calculate"}
          </button>
        </div>
      </div>

      {/* Result card */}
      {pnl && priceData && (
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
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
          </div>

          <div
            ref={resultRef}
            style={{
              background: "#1a1a1a",
              borderRadius: "20px",
              padding: "28px 28px 20px",
              maxWidth: "480px",
              fontFamily: "system-ui, -apple-system, sans-serif",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Top label */}
            <div style={{ color: "#fff", fontSize: "12px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "20px" }}>
              What would you have made?
            </div>

            {/* Market title */}
            <div style={{ color: "#fff", fontSize: "20px", fontWeight: 700, marginBottom: "6px" }}>
              {priceData.market.title}
            </div>

            {/* Direction + leverage tag */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{
                color: direction === "long" ? "#22c55e" : "#ef4444",
                fontSize: "13px",
                fontWeight: 600,
              }}>
                {direction === "long" ? "Buy" : "Sell"} | {leverage}X
              </span>
            </div>

            {/* Large PnL dollar amount */}
            <div style={{
              color: pnl.isLiquidated ? "#ef4444" : pnl.isProfit ? "#22c55e" : "#ef4444",
              fontSize: "42px",
              fontWeight: 800,
              lineHeight: 1,
              marginBottom: "4px",
            }}>
              {pnl.isLiquidated
                ? "LIQUIDATED"
                : `${pnl.isProfit ? "+" : "-"}$${Math.abs(pnl.profit).toFixed(2)}`}
            </div>

            {/* Smaller PnL percentage */}
            <div style={{
              color: pnl.isLiquidated ? "#f87171" : pnl.isProfit ? "#22c55e" : "#ef4444",
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "20px",
            }}>
              {pnl.isLiquidated
                ? "-100.00%"
                : `${pnl.returnPct >= 0 ? "+" : ""}${pnl.returnPct.toFixed(2)}%`}
            </div>

            {/* Bottom info row */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              marginBottom: "12px",
            }}>
              <div>
                <div style={{ color: "#666", fontSize: "11px", marginBottom: "4px" }}>Entry Price</div>
                <div style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>
                  {priceData.entryPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div style={{ color: "#666", fontSize: "11px", marginBottom: "4px" }}>Current Price</div>
                <div style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}>
                  {priceData.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div style={{ color: "#666", fontSize: "11px", marginBottom: "4px" }}>Return ({timeLabel})</div>
                <div style={{
                  color: pnl.isLiquidated ? "#ef4444" : pnl.isProfit ? "#22c55e" : "#ef4444",
                  fontSize: "14px",
                  fontWeight: 600,
                }}>
                  {pnl.isLiquidated
                    ? "-100.00%"
                    : `${pnl.returnPct >= 0 ? "+" : ""}${pnl.returnPct.toFixed(2)}%`}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/trendle-logo.png"
                alt="Trendle"
                style={{ width: "24px", height: "24px", borderRadius: "5px" }}
              />
              <span style={{ color: "#fff", fontSize: "13px" }}>
                trendle.fi/{priceData.market.slug}
              </span>
            </div>
          </div>

          {/* Tweet text */}
          <div className="mt-4 bg-card rounded-xl border border-border p-4" style={{ maxWidth: "480px" }}>
            <p className="text-sm text-muted-foreground mb-2">Tweet text:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-lg block whitespace-pre-wrap">
                {pnl.isLiquidated
                  ? `Would have been liquidated going ${direction} on ${priceData.market.title} with ${leverage}x leverage on @trendlefi`
                  : `Would have made ${pnl.isProfit ? "+" : "-"}$${Math.abs(pnl.profit).toFixed(2)} (${pnl.returnPct >= 0 ? "+" : ""}${pnl.returnPct.toFixed(1)}%) going ${direction} on ${priceData.market.title} with ${leverage}x leverage on @trendlefi`}
                {"\n\n"}https://trendle.fi/{priceData.market.slug}
              </code>
              <button
                onClick={() => {
                  const text = pnl.isLiquidated
                    ? `Would have been liquidated going ${direction} on ${priceData.market.title} with ${leverage}x leverage on @trendlefi\n\nhttps://trendle.fi/${priceData.market.slug}`
                    : `Would have made ${pnl.isProfit ? "+" : "-"}$${Math.abs(pnl.profit).toFixed(2)} (${pnl.returnPct >= 0 ? "+" : ""}${pnl.returnPct.toFixed(1)}%) going ${direction} on ${priceData.market.title} with ${leverage}x leverage on @trendlefi\n\nhttps://trendle.fi/${priceData.market.slug}`;
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-3 py-2 bg-muted rounded-lg text-sm font-medium hover:bg-border shrink-0"
              >
                Copy
              </button>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!priceData && !loading && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">
            Pick a market, set your parameters, and click &quot;Calculate&quot; to see what you would have made.
          </p>
        </div>
      )}
    </div>
  );
}
