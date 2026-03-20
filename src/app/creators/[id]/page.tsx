"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";

interface QuotedTrendle {
  tweetId: string;
  text: string;
  postedAt: string;
}

interface CreatorTweet {
  id: string;
  tweetId: string;
  text: string;
  postedAt: string;
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  mentionsTrendle: boolean;
  isQuoteTweet: boolean;
  quotedTweetId: string | null;
  quotedTrendle: QuotedTrendle | null;
}

interface CreatorDetail {
  id: string;
  twitterId: string;
  username: string;
  displayName: string;
  profileImage: string | null;
  followerCount: number;
  walletAddress: string | null;
  addedAt: string;
  tweets: CreatorTweet[];
}

interface ReferralData {
  creatorMetrics: {
    volume: number;
    tradingFees: number;
    holdingFees: number;
    imbalanceFees: number;
    fundingFees: number;
    totalTrades: number;
  } | null;
  summary: {
    totalReferrals: number;
    activeReferrals: number;
    totalReferredVolume: number;
    totalReferredFees: number;
    totalReferredFundingFees: number;
    totalReferredTrades: number;
  };
  referrals: {
    id: string;
    walletAddress: string;
    volume: number;
    tradingFees: number;
    holdingFees: number;
    imbalanceFees: number;
    fundingFees: number;
    totalTrades: number;
    firstTrade: string | null;
    lastTrade: string | null;
    isActive: boolean;
  }[];
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function formatUSD(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(2) + "K";
  return "$" + n.toFixed(2);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CreatorDetailPage() {
  const params = useParams();
  const [creator, setCreator] = useState<CreatorDetail | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "mentions" | "quotes">("all");
  const [tab, setTab] = useState<"tweets" | "trading" | "referrals">("tweets");

  useEffect(() => {
    async function load() {
      try {
        const [creatorRes, refRes] = await Promise.all([
          fetch(`/api/creators/${params.id}`),
          fetch(`/api/creators/${params.id}/referrals`),
        ]);
        if (!creatorRes.ok) throw new Error();
        setCreator(await creatorRes.json());
        if (refRes.ok) setReferralData(await refRes.json());
      } catch {
        setCreator(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (!creator) {
    return (
      <div>
        <Link href="/creators" className="text-primary text-sm hover:underline">
          Back to Creators
        </Link>
        <p className="mt-4 text-muted-foreground">Creator not found.</p>
      </div>
    );
  }

  const mentions = creator.tweets.filter((t) => !t.isQuoteTweet);
  const quoteTweets = creator.tweets.filter((t) => t.isQuoteTweet);
  const filtered =
    filter === "mentions"
      ? mentions
      : filter === "quotes"
        ? quoteTweets
        : creator.tweets;

  const totalImpressions = creator.tweets.reduce(
    (s, t) => s + t.impressions,
    0
  );
  const totalEngagement = creator.tweets.reduce(
    (s, t) => s + t.likes + t.retweets + t.replies + t.quotes,
    0
  );

  const cm = referralData?.creatorMetrics;
  const rs = referralData?.summary;

  return (
    <div>
      <Link
        href="/creators"
        className="text-primary text-sm hover:underline mb-6 inline-block"
      >
        Back to Creators
      </Link>

      <div className="flex items-center gap-4 mb-8">
        {creator.profileImage && (
          <img
            src={creator.profileImage}
            alt={creator.username}
            className="w-16 h-16 rounded-full"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold">{creator.displayName}</h2>
          <p className="text-muted-foreground">@{creator.username}</p>
          <a
            href={`https://x.com/${creator.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            View profile on X
          </a>
          {creator.walletAddress && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">Wallet:</span>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                {creator.walletAddress.slice(0, 6)}...
                {creator.walletAddress.slice(-4)}
              </code>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  navigator.clipboard.writeText(creator.walletAddress!);
                }}
                className="text-xs text-primary hover:underline"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Top-level stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Followers" value={formatNum(creator.followerCount)} />
        <StatCard label="Trendle Posts" value={creator.tweets.length} />
        <StatCard label="Tweet Views" value={formatNum(totalImpressions)} />
        <StatCard label="Engagement" value={formatNum(totalEngagement)} />
        {cm && (
          <StatCard label="Own Volume" value={formatUSD(cm.volume)} />
        )}
      </div>

      {/* Referral summary */}
      {rs && rs.totalReferrals > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Referrals" value={rs.totalReferrals} sub={`${rs.activeReferrals} active`} />
          <StatCard label="Referred Volume" value={formatUSD(rs.totalReferredVolume)} />
        </div>
      )}

      {/* Section tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-3">
        {(
          [
            ["tweets", "Tweets"],
            ["trading", "Trading"],
            ["referrals", `Referrals (${rs?.totalReferrals || 0})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* === TWEETS TAB === */}
      {tab === "tweets" && (
        <>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground mr-2">Show:</span>
            {(
              [
                ["all", `All (${creator.tweets.length})`],
                ["mentions", `Mentions (${mentions.length})`],
                ["quotes", `Quote Tweets (${quoteTweets.length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <p className="text-muted-foreground text-sm">No posts found yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((t) => (
                <a
                  key={t.id}
                  href={`https://x.com/${creator.username}/status/${t.tweetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-card rounded-xl border border-border p-5 hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        t.isQuoteTweet
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {t.isQuoteTweet ? "Quote Tweet" : "Mention"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(t.postedAt)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-3">{t.text}</p>
                  {t.isQuoteTweet && t.quotedTrendle && (
                    <div className="bg-muted rounded-lg p-3 mb-3 border-l-2 border-primary">
                      <p className="text-xs text-muted-foreground mb-1">
                        Quoting @trendlefi:
                      </p>
                      <p className="text-sm line-clamp-2 text-muted-foreground">
                        {t.quotedTrendle.text}
                      </p>
                    </div>
                  )}
                  {t.isQuoteTweet && t.quotedTweetId && !t.quotedTrendle && (
                    <div className="bg-muted rounded-lg p-3 mb-3 border-l-2 border-primary">
                      <p className="text-xs text-muted-foreground">
                        Quoted @trendlefi post
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {formatNum(t.impressions)} views
                    </span>
                    <span>{formatNum(t.likes)} likes</span>
                    <span>{formatNum(t.retweets)} retweets</span>
                    <span>{formatNum(t.replies)} replies</span>
                    {t.quotes > 0 && <span>{formatNum(t.quotes)} quotes</span>}
                    <span className="ml-auto text-primary">View on X &rarr;</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </>
      )}

      {/* === TRADING TAB === */}
      {tab === "trading" && (
        <div>
          {cm ? (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4">
                On-Chain Trading (Trendle)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Volume</p>
                  <p className="text-2xl font-bold">{formatUSD(cm.volume)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                  <p className="text-2xl font-bold">{cm.totalTrades}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trading Fees</p>
                  <p className="text-2xl font-bold">
                    {formatUSD(cm.tradingFees)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Holding Fees</p>
                  <p className="text-2xl font-bold">
                    {formatUSD(cm.holdingFees)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Imbalance Fees
                  </p>
                  <p className="text-2xl font-bold">
                    {formatUSD(cm.imbalanceFees)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Funding Fees Paid
                  </p>
                  <p className="text-2xl font-bold">
                    {formatUSD(cm.fundingFees)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Fees Paid
                  </p>
                  <p className="text-2xl font-bold">
                    {formatUSD(
                      cm.tradingFees +
                        cm.holdingFees +
                        cm.imbalanceFees +
                        cm.fundingFees
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <p className="text-muted-foreground text-sm">
                {creator.walletAddress
                  ? "No trading data found for this wallet."
                  : "No wallet address set for this creator."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* === REFERRALS TAB === */}
      {tab === "referrals" && (
        <div>
          {!referralData || referralData.referrals.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <p className="text-muted-foreground text-sm">
                No referral data available for this creator.
              </p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                      #
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                      Wallet
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">
                      Volume
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">
                      Trades
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">
                      Trading Fees
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">
                      Funding Fees
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">
                      Total Fees
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referralData.referrals.map((r, i) => (
                    <tr
                      key={r.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono">
                          {r.walletAddress.slice(0, 6)}...
                          {r.walletAddress.slice(-4)}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {r.volume > 0 ? formatUSD(r.volume) : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {r.totalTrades || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {r.tradingFees > 0 ? formatUSD(r.tradingFees) : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {r.fundingFees > 0 ? formatUSD(r.fundingFees) : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {r.tradingFees + r.holdingFees + r.imbalanceFees + r.fundingFees > 0
                          ? formatUSD(
                              r.tradingFees +
                                r.holdingFees +
                                r.imbalanceFees +
                                r.fundingFees
                            )
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            r.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {r.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-semibold">
                    <td className="px-4 py-3 text-xs" colSpan={2}>
                      Total ({referralData.referrals.length} referrals)
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatUSD(referralData.summary.totalReferredVolume)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {referralData.summary.totalReferredTrades}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatUSD(referralData.summary.totalReferredFees)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatUSD(referralData.summary.totalReferredFundingFees)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatUSD(
                        referralData.summary.totalReferredFees +
                          referralData.summary.totalReferredFundingFees
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {referralData.summary.activeReferrals} active
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
