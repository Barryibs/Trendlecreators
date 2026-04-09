"use client";

import { useState, useRef } from "react";

interface TrendleMarket {
  name: string;
  slug: string;
  category: "crypto" | "people" | "entertainment" | "tech" | "other";
}

const MARKETS: TrendleMarket[] = [
  // Crypto
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
  // People
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
  // Entertainment
  { name: "GTA 6", slug: "gta-6", category: "entertainment" },
  { name: "Pokemon", slug: "pokemon", category: "entertainment" },
  { name: "Harry Potter", slug: "harry-potter", category: "entertainment" },
  { name: "Sydney Sweeney", slug: "sydney-sweeney", category: "entertainment" },
  { name: "Margot Robbie", slug: "margot-robbie", category: "entertainment" },
  // Tech
  { name: "Anthropic", slug: "anthropic", category: "tech" },
  { name: "ChatGPT", slug: "chatgpt", category: "tech" },
  { name: "Mac Mini", slug: "mac-mini", category: "tech" },
  // Other
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
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const filtered =
    filterCat === "all"
      ? MARKETS
      : MARKETS.filter((m) => m.category === filterCat);

  const tradeUrl = `https://trendle.fi/${selectedMarket.slug}`;

  const handleGenerate = () => {
    setGenerated(true);
  };

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
        Generate shareable visuals for Trendle attention markets to post under tweets.
      </p>

      {/* Controls */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Category filter */}
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

          {/* Market selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select Market</label>
            <div className="flex flex-wrap gap-2">
              {filtered.map((m) => (
                <button
                  key={m.slug}
                  onClick={() => {
                    setSelectedMarket(m);
                    setGenerated(false);
                  }}
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
            className="self-start px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90"
          >
            Generate Visual
          </button>
        </div>
      </div>

      {/* Generated Visual */}
      {generated && (
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
              View on Trendle
            </a>
          </div>

          {/* The exportable card */}
          <div
            ref={cardRef}
            style={{
              background: "linear-gradient(145deg, #09090b 0%, #18181b 40%, #09090b 100%)",
              borderRadius: "20px",
              padding: "36px",
              maxWidth: "560px",
              fontFamily: "system-ui, -apple-system, sans-serif",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Subtle glow effect */}
            <div
              style={{
                position: "absolute",
                top: "-60px",
                right: "-60px",
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent)",
                pointerEvents: "none",
              }}
            />

            {/* Top: Trendle branding */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #6366f1, #818cf8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  color: "#fff",
                  fontSize: "16px",
                }}
              >
                T
              </div>
              <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "18px" }}>
                Trendle
              </span>
              <span style={{ color: "#52525b", fontSize: "14px" }}>
                Attention Markets
              </span>
            </div>

            {/* Market name */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ color: "#a1a1aa", fontSize: "13px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                Attention Market
              </div>
              <div style={{ color: "#ffffff", fontSize: "36px", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.5px" }}>
                {selectedMarket.name}
              </div>
            </div>

            {/* Description */}
            <div style={{ color: "#71717a", fontSize: "14px", lineHeight: 1.6, marginBottom: "28px", maxWidth: "420px" }}>
              Trade the attention index for <span style={{ color: "#a1a1aa" }}>{selectedMarket.name}</span>.
              Go <span style={{ color: "#22c55e", fontWeight: 600 }}>UP</span> if you think attention is heating up,
              or <span style={{ color: "#ef4444", fontWeight: 600 }}>DOWN</span> if it&apos;s fading. Up to 5x leverage.
            </div>

            {/* Visual indicator bars */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "28px" }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${20 + Math.sin(i * 0.8) * 15 + Math.random() * 10}px`,
                    borderRadius: "3px",
                    background: i < 12
                      ? `rgba(34,197,94,${0.2 + (i / 20) * 0.6})`
                      : `rgba(239,68,68,${0.2 + ((20 - i) / 20) * 0.6})`,
                    alignSelf: "flex-end",
                  }}
                />
              ))}
            </div>

            {/* Action buttons row */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
              <div
                style={{
                  flex: 1,
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  borderRadius: "12px",
                  padding: "14px",
                  textAlign: "center",
                }}
              >
                <div style={{ color: "#22c55e", fontWeight: 700, fontSize: "18px" }}>UP</div>
                <div style={{ color: "#4ade80", fontSize: "11px", marginTop: "2px" }}>Attention Rising</div>
              </div>
              <div
                style={{
                  flex: 1,
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: "12px",
                  padding: "14px",
                  textAlign: "center",
                }}
              >
                <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "18px" }}>DOWN</div>
                <div style={{ color: "#f87171", fontSize: "11px", marginTop: "2px" }}>Attention Fading</div>
              </div>
            </div>

            {/* Footer with trade link */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid rgba(63,63,70,0.5)",
                paddingTop: "20px",
              }}
            >
              <div style={{ color: "#52525b", fontSize: "13px" }}>
                trendle.fi/{selectedMarket.slug}
              </div>
              <div
                style={{
                  background: "linear-gradient(135deg, #6366f1, #818cf8)",
                  padding: "8px 20px",
                  borderRadius: "10px",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                Trade Now
              </div>
            </div>
          </div>

          {/* Copy tweet text */}
          <div className="mt-4 bg-card rounded-xl border border-border p-4" style={{ maxWidth: "560px" }}>
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

      {/* Empty state */}
      {!generated && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">
            Select a market then click &quot;Generate Visual&quot; to create a shareable image for tweets.
          </p>
        </div>
      )}
    </div>
  );
}
