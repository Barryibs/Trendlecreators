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
  const [imageExists, setImageExists] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const filtered =
    filterCat === "all"
      ? MARKETS
      : MARKETS.filter((m) => m.category === filterCat);

  const tradeUrl = `https://trendle.fi/${selectedMarket.slug}`;
  const screenshotSrc = `/screenshots/${selectedMarket.slug}.png`;

  useEffect(() => {
    setImageExists(false);
    const img = new Image();
    img.onload = () => setImageExists(true);
    img.onerror = () => setImageExists(false);
    img.src = screenshotSrc;
  }, [screenshotSrc]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const html2canvas = (await import("html2canvas-pro")).default;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: null,
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
      backgroundColor: null,
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
        Select a market to generate a shareable visual for tweets.
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
        </div>
      </div>

      {/* Visual */}
      {imageExists ? (
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
              src={screenshotSrc}
              alt={`${selectedMarket.name} attention market`}
              style={{ width: "100%", display: "block" }}
            />

            {/* UP / DOWN buttons */}
            <div style={{ display: "flex", gap: "10px", padding: "12px 16px" }}>
              <div
                style={{
                  flex: 1,
                  background: "rgba(34,197,94,0.15)",
                  border: "1px solid rgba(34,197,94,0.4)",
                  borderRadius: "12px",
                  padding: "12px",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                <div style={{ color: "#22c55e", fontWeight: 700, fontSize: "16px" }}>Up</div>
                <div style={{ color: "#4ade80", fontSize: "11px", marginTop: "2px" }}>Attention Rising</div>
              </div>
              <div
                style={{
                  flex: 1,
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  borderRadius: "12px",
                  padding: "12px",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "16px" }}>Down</div>
                <div style={{ color: "#f87171", fontSize: "11px", marginTop: "2px" }}>Attention Fading</div>
              </div>
            </div>

            {/* Footer: Trendle branding + trade link */}
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
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    background: "linear-gradient(135deg, #6366f1, #818cf8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    color: "#fff",
                    fontSize: "12px",
                  }}
                >
                  T
                </div>
                <span style={{ color: "#a1a1aa", fontSize: "13px" }}>
                  trendle.fi/{selectedMarket.slug}
                </span>
              </div>
              <div
                style={{
                  background: "linear-gradient(135deg, #6366f1, #818cf8)",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  color: "#fff",
                  fontWeight: 600,
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
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">
            No screenshot available for {selectedMarket.name} yet.
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            Run <code className="bg-muted px-1.5 py-0.5 rounded">npx tsx scripts/capture-market-cards.ts</code> to capture.
          </p>
        </div>
      )}
    </div>
  );
}
