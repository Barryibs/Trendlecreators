"use client";

import { useState, useRef, useEffect } from "react";

interface TrendleMarket {
  name: string;
  slug: string;
  category: "crypto" | "people" | "entertainment" | "tech" | "other";
}

const MARKETS: TrendleMarket[] = [
  { name: "Bitcoin", slug: "bitcoin", category: "crypto" },
  { name: "Solana", slug: "solana", category: "crypto" },
  { name: "Hyperliquid", slug: "hyperliquid", category: "crypto" },
  { name: "Monad", slug: "monad", category: "crypto" },
  { name: "MegaETH", slug: "megaeth", category: "crypto" },
  { name: "Polymarket", slug: "polymarket", category: "crypto" },
  { name: "Sonic", slug: "sonic", category: "crypto" },
  { name: "Kalshi", slug: "kalshi", category: "crypto" },
  { name: "Artemis", slug: "artemis", category: "crypto" },
  { name: "OpenClaw", slug: "openclaw", category: "crypto" },
  { name: "Elon Musk", slug: "elon-musk", category: "people" },
  { name: "Donald Trump", slug: "donald-trump", category: "people" },
  { name: "Drake", slug: "drake", category: "people" },
  { name: "Taylor Swift", slug: "taylor-swift", category: "people" },
  { name: "Kanye West", slug: "kanye-west", category: "people" },
  { name: "Cristiano Ronaldo", slug: "cristiano-ronaldo", category: "people" },
  { name: "Bryan Johnson", slug: "bryan-johnson", category: "people" },
  { name: "Obama", slug: "obama", category: "people" },
  { name: "Vladimir Putin", slug: "vladimir-putin", category: "people" },
  { name: "Volodymyr Zelenskyy", slug: "volodymyr-zelenskyy", category: "people" },
  { name: "ZachXBT", slug: "zachxbt", category: "people" },
  { name: "Palm Beach Pete", slug: "palm-beach-pete", category: "people" },
  { name: "Punch Kun", slug: "punch-kun", category: "people" },
  { name: "GTA 6", slug: "gta-6", category: "entertainment" },
  { name: "Pokemon", slug: "pokemon", category: "entertainment" },
  { name: "Harry Potter", slug: "harry-potter", category: "entertainment" },
  { name: "Sydney Sweeney", slug: "sydney-sweeney", category: "entertainment" },
  { name: "Margot Robbie", slug: "margot-robbie", category: "entertainment" },
  { name: "Anthropic", slug: "anthropic", category: "tech" },
  { name: "ChatGPT", slug: "chatgpt", category: "tech" },
  { name: "Mac Mini", slug: "mac-mini", category: "tech" },
  { name: "Creatine", slug: "creatine", category: "other" },
  { name: "KitKat", slug: "kitkat", category: "other" },
  { name: "Looksmaxxing", slug: "looksmaxxing", category: "other" },
  { name: "Iran", slug: "iran", category: "other" },
  { name: "Jeffrey Epstein", slug: "jeffrey-epstein", category: "other" },
  { name: "World Cup", slug: "world-cup", category: "entertainment" },
];

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "crypto", label: "Crypto" },
  { key: "people", label: "People" },
  { key: "entertainment", label: "Entertainment" },
  { key: "tech", label: "Tech" },
  { key: "other", label: "Other" },
];

export default function MarketVisualsPage() {
  const [selectedMarket, setSelectedMarket] = useState<TrendleMarket>(MARKETS[0]);
  const [filterCat, setFilterCat] = useState("all");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [hasCached, setHasCached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const filtered =
    filterCat === "all"
      ? MARKETS
      : MARKETS.filter((m) => m.category === filterCat);

  const tradeUrl = `https://trendle.fi/${selectedMarket.slug}`;
  const cachedSrc = `/screenshots/${selectedMarket.slug}.png`;

  // Check if a cached screenshot exists when market changes
  useEffect(() => {
    setScreenshotUrl(null);
    setHasCached(false);
    setError(null);
    const img = new Image();
    img.onload = () => {
      setHasCached(true);
      setScreenshotUrl(cachedSrc);
    };
    img.onerror = () => setHasCached(false);
    img.src = cachedSrc;
  }, [cachedSrc]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const res = await fetch(`/api/capture-card?slug=${selectedMarket.slug}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error("Failed to capture");
      const blob = await res.blob();
      // Revoke old URL if any
      if (screenshotUrl && screenshotUrl.startsWith("blob:")) {
        URL.revokeObjectURL(screenshotUrl);
      }
      const url = URL.createObjectURL(blob);
      setScreenshotUrl(url);
      setHasCached(true);
    } catch {
      setError("Failed to generate visual. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const html2canvas = (await import("html2canvas-pro")).default;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#09090b",
      scale: 2,
      useCORS: true,
    });
    const link = document.createElement("a");
    link.download = `${selectedMarket.slug}-trendle.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    const html2canvas = (await import("html2canvas-pro")).default;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#09090b",
      scale: 2,
      useCORS: true,
    });
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

  const handleCopyText = () => {
    navigator.clipboard.writeText(
      `Trade the ${selectedMarket.name} attention market on @trendlefi\n\n${tradeUrl}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Market Visuals</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Generate shareable market visuals with live prices from Trendle.
      </p>

      {/* Controls */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setFilterCat(c.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterCat === c.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-border"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Select Market</label>
            <div className="flex flex-wrap gap-2">
              {filtered.map((m) => (
                <button
                  key={m.slug}
                  onClick={() => setSelectedMarket(m)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedMarket.slug === m.slug
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-border"
                  }`}
                >
                  {m.name}
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

      {loading && (
        <div className="bg-card rounded-xl border border-border p-12 text-center mb-6">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground text-sm">
            Capturing live data from trendle.fi...
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            First time takes ~30s, subsequent captures are faster
          </p>
        </div>
      )}

      {/* Visual */}
      {screenshotUrl && !loading && (
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
            <a
              href={tradeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-muted"
            >
              Open on Trendle
            </a>
          </div>

          {/* Exportable card */}
          <div
            ref={cardRef}
            style={{
              background: "#09090b",
              borderRadius: "20px",
              overflow: "hidden",
              maxWidth: "480px",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {/* Market card screenshot */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshotUrl}
              alt={`${selectedMarket.name} attention market`}
              style={{ width: "100%", display: "block", borderRadius: "20px 20px 0 0" }}
            />

            {/* UP / DOWN buttons */}
            <div
              style={{
                display: "flex",
                margin: "0 12px",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "14px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  flex: 1,
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  borderRadius: "12px",
                  margin: "4px",
                  padding: "12px",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span style={{ color: "#22c55e", fontSize: "14px" }}>&#8599;</span>
                <span style={{ color: "#22c55e", fontWeight: 600, fontSize: "15px" }}>Up</span>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "12px",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span style={{ color: "#a1a1aa", fontSize: "14px" }}>&#8600;</span>
                <span style={{ color: "#a1a1aa", fontWeight: 600, fontSize: "15px" }}>Down</span>
              </div>
            </div>

            {/* Footer: Trendle logo + link + Trade Now */}
            <div
              style={{
                padding: "12px 16px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid rgba(63,63,70,0.4)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/trendle-logo.png"
                  alt="Trendle"
                  style={{ width: "28px", height: "28px", borderRadius: "6px" }}
                />
                <span style={{ color: "#a1a1aa", fontSize: "13px" }}>
                  trendle.fi/{selectedMarket.slug}
                </span>
              </div>
              <div
                style={{
                  background: "#CCFF00",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
              >
                Trade Now
              </div>
            </div>
          </div>

          {/* Tweet text */}
          <div className="mt-4 bg-card rounded-xl border border-border p-4" style={{ maxWidth: "480px" }}>
            <p className="text-sm text-muted-foreground mb-2">Tweet text:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-lg block whitespace-pre-wrap">
                Trade the {selectedMarket.name} attention market on @trendlefi{"\n\n"}{tradeUrl}
              </code>
              <button
                onClick={handleCopyText}
                className="px-3 py-2 bg-muted rounded-lg text-sm font-medium hover:bg-border shrink-0"
              >
                Copy
              </button>
            </div>
          </div>
        </>
      )}

      {/* Empty state - no cached image and not loading */}
      {!screenshotUrl && !loading && !error && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">
            Select a market and click &quot;Generate Visual&quot; to capture a live screenshot with current prices.
          </p>
        </div>
      )}
    </div>
  );
}
