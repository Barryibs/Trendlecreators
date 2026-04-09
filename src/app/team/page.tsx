"use client";

import { useState, useCallback } from "react";

interface Allocation {
  id: string;
  username: string;
  displayName: string;
  profileImage: string | null;
  followerCount: number;
  totalTweets: number;
  trendleMentions: number;
  totalImpressions: number;
  totalEngagement: number;
  interactionCount: number;
  referralCount: number;
  referralVolume: number;
  score: number;
  payout: number;
}

interface AllocationsData {
  allocations: Allocation[];
  period: string;
  totalBudget: string;
  totalAllocated: number;
  activeCreators: number;
  inactiveCreators: number;
}

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function TeamPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [wrongPass, setWrongPass] = useState(false);
  const [data, setData] = useState<AllocationsData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "trendlec2026") {
      setAuthenticated(true);
      setWrongPass(false);
      fetchData();
    } else {
      setWrongPass(true);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/allocations");
      const json = await res.json();
      setData(json);
    } catch {
      console.error("Failed to load allocations");
    } finally {
      setLoading(false);
    }
  }, []);

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-card rounded-xl border border-border p-8 w-full max-w-sm">
          <h2 className="text-xl font-bold mb-1 text-center">Trendle Team</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter password to access
          </p>
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setWrongPass(false);
              }}
              placeholder="Password"
              className="px-4 py-2.5 border border-border rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            {wrongPass && (
              <p className="text-destructive text-xs">Incorrect password</p>
            )}
            <button
              type="submit"
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Trendle Team</h2>
        <p className="text-muted-foreground">Loading allocations...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Trendle Team - Creator Payouts</h2>
      <p className="text-sm text-muted-foreground mb-1">
        Fair allocation based on each creator&apos;s contributions: impressions, engagement, Trendle mentions, interactions with @trendlefi posts, and referrals.
      </p>
      <p className="text-sm font-semibold text-primary mb-6">
        Period: {data.period}
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="text-sm text-muted-foreground">Total Allocated</div>
          <div className="text-2xl font-bold mt-1">
            ${data.totalAllocated.toLocaleString()}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="text-sm text-muted-foreground">Active Creators</div>
          <div className="text-2xl font-bold mt-1">{data.activeCreators}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="text-sm text-muted-foreground">Payout Range</div>
          <div className="text-2xl font-bold mt-1">{data.totalBudget}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="text-sm text-muted-foreground">No Contribution</div>
          <div className="text-2xl font-bold mt-1">{data.inactiveCreators}</div>
        </div>
      </div>

      {/* Allocation methodology */}
      <div className="bg-card rounded-xl border border-border p-5 mb-8">
        <h3 className="text-sm font-semibold mb-3">Allocation Formula</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Each creator&apos;s contribution score is calculated as:
          <span className="block mt-2 font-mono bg-muted px-2 py-1.5 rounded text-xs">
            Score = Impressions&times;1 + Engagement&times;10 + Trendle&nbsp;Posts&times;500 + Interactions&times;200 + Referrals&times;100 + Referred&nbsp;Volume&times;5
          </span>
          <span className="block mt-2">
            Scores are then linearly mapped to the $200-$500 range. Highest contributor gets $500, lowest active contributor gets $200. Creators with zero contribution get $0.
          </span>
        </p>
      </div>

      {/* Allocations table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-semibold">#</th>
              <th className="text-left px-4 py-3 font-semibold">Creator</th>
              <th className="text-right px-4 py-3 font-semibold">Trendle Posts</th>
              <th className="text-right px-4 py-3 font-semibold">Impressions</th>
              <th className="text-right px-4 py-3 font-semibold">Engagement</th>
              <th className="text-right px-4 py-3 font-semibold">Interactions</th>
              <th className="text-right px-4 py-3 font-semibold">Referrals</th>
              <th className="text-right px-4 py-3 font-semibold">Ref. Volume</th>
              <th className="text-right px-4 py-3 font-semibold">Score</th>
              <th className="text-right px-4 py-3 font-semibold">Payout</th>
            </tr>
          </thead>
          <tbody>
            {data.allocations.map((a, i) => (
              <tr
                key={a.id}
                className={`border-b border-border last:border-0 ${
                  a.payout === 0 ? "opacity-40" : ""
                }`}
              >
                <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {a.profileImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.profileImage}
                        alt=""
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <div>
                      <div className="font-medium">{a.displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        @{a.username}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">{a.trendleMentions}</td>
                <td className="px-4 py-3 text-right">
                  {formatNum(a.totalImpressions)}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatNum(a.totalEngagement)}
                </td>
                <td className="px-4 py-3 text-right">{a.interactionCount}</td>
                <td className="px-4 py-3 text-right">{a.referralCount}</td>
                <td className="px-4 py-3 text-right">
                  {a.referralVolume > 0
                    ? `$${formatNum(a.referralVolume)}`
                    : "-"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  {formatNum(a.score)}
                </td>
                <td className="px-4 py-3 text-right">
                  {a.payout > 0 ? (
                    <span className="font-bold text-success">
                      ${a.payout}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">$0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50 font-semibold">
              <td className="px-4 py-3" colSpan={2}>
                Total
              </td>
              <td className="px-4 py-3 text-right">
                {data.allocations.reduce((s, a) => s + a.trendleMentions, 0)}
              </td>
              <td className="px-4 py-3 text-right">
                {formatNum(
                  data.allocations.reduce((s, a) => s + a.totalImpressions, 0)
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {formatNum(
                  data.allocations.reduce((s, a) => s + a.totalEngagement, 0)
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {data.allocations.reduce((s, a) => s + a.interactionCount, 0)}
              </td>
              <td className="px-4 py-3 text-right">
                {data.allocations.reduce((s, a) => s + a.referralCount, 0)}
              </td>
              <td className="px-4 py-3 text-right">
                $
                {formatNum(
                  data.allocations.reduce((s, a) => s + a.referralVolume, 0)
                )}
              </td>
              <td className="px-4 py-3 text-right"></td>
              <td className="px-4 py-3 text-right text-success">
                ${data.totalAllocated.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
