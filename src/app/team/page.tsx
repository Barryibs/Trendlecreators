"use client";

import { useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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
  score10: number;
  weeksWithPosts: number;
  totalWeeks: number;
  meetsContentReq: boolean;
  meetsEngagementReq: boolean;
  meetsMinimum: boolean;
  payout: number;
}

interface MonthlyTotal {
  month: string;
  label: string;
  impressions: number;
  engagement: number;
  mentions: number;
  interactions: number;
  referrals: number;
  volume: number;
  score: number;
}

interface CreatorMonthly {
  id: string;
  username: string;
  displayName: string;
  profileImage: string | null;
  months: MonthlyTotal[];
}

interface AllocationsData {
  allocations: Allocation[];
  period: string;
  totalBudget: string;
  totalAllocated: number;
  eligibleCreators: number;
  ineligibleCreators: number;
  monthlyTotals: MonthlyTotal[];
  creatorMonthly: CreatorMonthly[];
}

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const CHART_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
  "#a855f7", "#0ea5e9", "#e11d48", "#10b981", "#eab308",
  "#7c3aed", "#2563eb", "#dc2626",
];

export default function TeamPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [wrongPass, setWrongPass] = useState(false);
  const [data, setData] = useState<AllocationsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);

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
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const activeMonths = data.monthlyTotals.filter((m) => m.score > 0);
  const creatorForDetail = selectedCreator
    ? data.creatorMonthly.find((c) => c.id === selectedCreator)
    : null;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Trendle Team</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Creator program performance and payout allocation.
      </p>

      {/* ===== SECTION 1: Monthly Performance Overview ===== */}
      <h3 className="text-lg font-semibold mb-4">Program Performance by Month</h3>

      {activeMonths.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Impressions & Engagement chart */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h4 className="text-sm font-semibold mb-4">Impressions & Engagement</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={activeMonths}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickFormatter={(v) => v.split(" ")[0]} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNum(v)} />
                <Tooltip formatter={(v) => formatNum(Number(v))} />
                <Legend />
                <Bar dataKey="impressions" name="Impressions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="engagement" name="Engagement" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Mentions & Interactions chart */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h4 className="text-sm font-semibold mb-4">Trendle Posts & Interactions</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={activeMonths}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickFormatter={(v) => v.split(" ")[0]} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="mentions" name="Trendle Posts" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="interactions" name="Interactions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Referrals & Volume chart */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h4 className="text-sm font-semibold mb-4">Referrals & Volume</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={activeMonths}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickFormatter={(v) => v.split(" ")[0]} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${formatNum(v)}`} />
                <Tooltip formatter={(v, name) => name === "Volume" ? `$${formatNum(Number(v))}` : Number(v)} />
                <Legend />
                <Bar yAxisId="left" dataKey="referrals" name="Referrals" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="volume" name="Volume" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Overall score trend */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h4 className="text-sm font-semibold mb-4">Overall Contribution Score</h4>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={activeMonths}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickFormatter={(v) => v.split(" ")[0]} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNum(v)} />
                <Tooltip formatter={(v) => formatNum(Number(v))} />
                <Line type="monotone" dataKey="score" name="Score" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly totals table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-semibold">Month</th>
              <th className="text-right px-4 py-3 font-semibold">Impressions</th>
              <th className="text-right px-4 py-3 font-semibold">Engagement</th>
              <th className="text-right px-4 py-3 font-semibold">Trendle Posts</th>
              <th className="text-right px-4 py-3 font-semibold">Interactions</th>
              <th className="text-right px-4 py-3 font-semibold">Referrals</th>
              <th className="text-right px-4 py-3 font-semibold">Volume</th>
              <th className="text-right px-4 py-3 font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {activeMonths.map((m) => (
              <tr key={m.month} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{m.label}</td>
                <td className="px-4 py-3 text-right">{formatNum(m.impressions)}</td>
                <td className="px-4 py-3 text-right">{formatNum(m.engagement)}</td>
                <td className="px-4 py-3 text-right">{m.mentions}</td>
                <td className="px-4 py-3 text-right">{m.interactions}</td>
                <td className="px-4 py-3 text-right">{m.referrals}</td>
                <td className="px-4 py-3 text-right">${formatNum(m.volume)}</td>
                <td className="px-4 py-3 text-right font-mono text-xs">{formatNum(m.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== SECTION 2: Per-Creator Monthly Breakdown ===== */}
      <h3 className="text-lg font-semibold mb-4">Creator Performance by Month</h3>

      <div className="flex flex-wrap gap-2 mb-6">
        {data.creatorMonthly.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCreator(selectedCreator === c.id ? null : c.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCreator === c.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-border"
            }`}
          >
            @{c.username}
          </button>
        ))}
      </div>

      {creatorForDetail && (() => {
        const activeCreatorMonths = creatorForDetail.months.filter((m) => m.score > 0);
        if (activeCreatorMonths.length === 0) {
          return (
            <div className="bg-card rounded-xl border border-border p-8 text-center mb-10">
              <p className="text-muted-foreground text-sm">No activity data for @{creatorForDetail.username}</p>
            </div>
          );
        }
        return (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold mb-4">
                  @{creatorForDetail.username} - Impressions & Engagement
                </h4>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={activeCreatorMonths}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickFormatter={(v) => v.split(" ")[0]} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNum(v)} />
                    <Tooltip formatter={(v) => formatNum(Number(v))} />
                    <Legend />
                    <Bar dataKey="impressions" name="Impressions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="engagement" name="Engagement" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold mb-4">
                  @{creatorForDetail.username} - Score Trend
                </h4>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={activeCreatorMonths}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickFormatter={(v) => v.split(" ")[0]} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatNum(v)} />
                    <Tooltip formatter={(v) => formatNum(Number(v))} />
                    <Line type="monotone" dataKey="score" name="Score" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Creator monthly table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden mb-10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-semibold">Month</th>
                    <th className="text-right px-4 py-3 font-semibold">Impressions</th>
                    <th className="text-right px-4 py-3 font-semibold">Engagement</th>
                    <th className="text-right px-4 py-3 font-semibold">Posts</th>
                    <th className="text-right px-4 py-3 font-semibold">Interactions</th>
                    <th className="text-right px-4 py-3 font-semibold">Referrals</th>
                    <th className="text-right px-4 py-3 font-semibold">Volume</th>
                    <th className="text-right px-4 py-3 font-semibold">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCreatorMonths.map((m) => (
                    <tr key={m.month} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{m.label}</td>
                      <td className="px-4 py-3 text-right">{formatNum(m.impressions)}</td>
                      <td className="px-4 py-3 text-right">{formatNum(m.engagement)}</td>
                      <td className="px-4 py-3 text-right">{m.mentions}</td>
                      <td className="px-4 py-3 text-right">{m.interactions}</td>
                      <td className="px-4 py-3 text-right">{m.referrals}</td>
                      <td className="px-4 py-3 text-right">{m.volume > 0 ? `$${formatNum(m.volume)}` : "-"}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{formatNum(m.score)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}

      {/* ===== SECTION 3: All Creators Comparison Chart ===== */}
      <h3 className="text-lg font-semibold mb-4">Creator Comparison - March Score /10</h3>
      <div className="bg-card rounded-xl border border-border p-5 mb-10">
        <ResponsiveContainer width="100%" height={Math.max(300, data.allocations.filter((a) => a.score > 0).length * 36)}>
          <BarChart
            data={data.allocations.filter((a) => a.score > 0)}
            layout="vertical"
            margin={{ left: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 10]} />
            <YAxis type="category" dataKey="username" tick={{ fontSize: 12 }} tickFormatter={(v) => `@${v}`} width={100} />
            <Tooltip formatter={(v) => Number(v).toFixed(1) + " / 10"} />
            <Bar dataKey="score10" name="Score /10" fill="#6366f1" radius={[0, 4, 4, 0]}>
              {data.allocations
                .filter((a) => a.score > 0)
                .map((_, i) => (
                  <rect key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ===== SECTION 4: Payout Allocation ===== */}
      <h3 className="text-lg font-semibold mb-2">Payout Allocation</h3>
      <p className="text-sm text-muted-foreground mb-1">
        Based on {data.period} contributions only.
      </p>
      <p className="text-sm font-semibold text-primary mb-4">
        Range: {data.totalBudget}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="text-sm text-muted-foreground">Total Allocated</div>
          <div className="text-2xl font-bold mt-1">${data.totalAllocated.toLocaleString()}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="text-sm text-muted-foreground">Eligible</div>
          <div className="text-2xl font-bold mt-1 text-success">{data.eligibleCreators}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="text-sm text-muted-foreground">Not Eligible</div>
          <div className="text-2xl font-bold mt-1 text-destructive">{data.ineligibleCreators}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="text-sm text-muted-foreground">Avg Payout</div>
          <div className="text-2xl font-bold mt-1">
            ${data.eligibleCreators > 0 ? Math.round(data.totalAllocated / data.eligibleCreators) : 0}
          </div>
        </div>
      </div>

      {/* Minimum requirements */}
      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <h4 className="text-sm font-semibold mb-3">Minimum Requirements for Payout</h4>
        <div className="text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-success">&#10003;</span>
            <span>At least 1 piece of content per week about Trendle (posts, articles, videos, quote tweets)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-success">&#10003;</span>
            <span>Support Trendle&apos;s main account content (likes, retweets, comments on @trendlefi posts)</span>
          </div>
          <div className="mt-2 text-muted-foreground">
            Creators who don&apos;t meet both requirements receive $0 regardless of score.
          </div>
        </div>
      </div>

      {/* Formula */}
      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <h4 className="text-sm font-semibold mb-3">Allocation Formula</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="block font-mono bg-muted px-2 py-1.5 rounded text-xs">
            Score = Impressions&times;10 + Trendle&nbsp;Posts&times;1000 + Engagement&times;5 + Interactions&times;200 + Referrals&times;100 + Referred&nbsp;Volume&times;3
          </span>
          <span className="block mt-2">
            Scores linearly mapped to $200-$500. Top scorer = $500, lowest active = $200, zero contribution = $0.
          </span>
        </p>
      </div>

      {/* Payout table */}
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
              <th className="text-right px-4 py-3 font-semibold">Score /10</th>
              <th className="text-center px-4 py-3 font-semibold">Eligible</th>
              <th className="text-right px-4 py-3 font-semibold">Payout</th>
            </tr>
          </thead>
          <tbody>
            {data.allocations.map((a, i) => (
              <tr key={a.id} className={`border-b border-border last:border-0 ${a.payout === 0 ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {a.profileImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.profileImage} alt="" className="w-6 h-6 rounded-full" />
                    )}
                    <div>
                      <div className="font-medium">{a.displayName}</div>
                      <div className="text-xs text-muted-foreground">@{a.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={a.meetsContentReq ? "" : "text-destructive"}>{a.trendleMentions}</span>
                  <span className="text-xs text-muted-foreground ml-1">({a.weeksWithPosts}/{a.totalWeeks}w)</span>
                </td>
                <td className="px-4 py-3 text-right">{formatNum(a.totalImpressions)}</td>
                <td className="px-4 py-3 text-right">{formatNum(a.totalEngagement)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={a.meetsEngagementReq ? "" : "text-destructive"}>{a.interactionCount}</span>
                </td>
                <td className="px-4 py-3 text-right">{a.referralCount}</td>
                <td className="px-4 py-3 text-right">{a.referralVolume > 0 ? `$${formatNum(a.referralVolume)}` : "-"}</td>
                <td className="px-4 py-3 text-right font-semibold">{a.score10.toFixed(1)}</td>
                <td className="px-4 py-3 text-center">
                  {a.meetsMinimum ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Yes</span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      {!a.meetsContentReq && !a.meetsEngagementReq ? "No posts/engagement" : !a.meetsContentReq ? "Missing weekly posts" : "No engagement"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {a.payout > 0 ? (
                    <span className="font-bold text-success">${a.payout}</span>
                  ) : (
                    <span className="text-muted-foreground">$0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50 font-semibold">
              <td className="px-4 py-3" colSpan={2}>Total</td>
              <td className="px-4 py-3 text-right">{data.allocations.reduce((s, a) => s + a.trendleMentions, 0)}</td>
              <td className="px-4 py-3 text-right">{formatNum(data.allocations.reduce((s, a) => s + a.totalImpressions, 0))}</td>
              <td className="px-4 py-3 text-right">{formatNum(data.allocations.reduce((s, a) => s + a.totalEngagement, 0))}</td>
              <td className="px-4 py-3 text-right">{data.allocations.reduce((s, a) => s + a.interactionCount, 0)}</td>
              <td className="px-4 py-3 text-right">{data.allocations.reduce((s, a) => s + a.referralCount, 0)}</td>
              <td className="px-4 py-3 text-right">${formatNum(data.allocations.reduce((s, a) => s + a.referralVolume, 0))}</td>
              <td className="px-4 py-3 text-right">-</td>
              <td className="px-4 py-3 text-center">{data.eligibleCreators}/{data.allocations.length}</td>
              <td className="px-4 py-3 text-right text-success">${data.totalAllocated.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
