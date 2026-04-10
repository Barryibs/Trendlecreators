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
  isExcluded: boolean;
  isEligible: boolean;
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

interface MonthlyPayout {
  month: string;
  label: string;
  totalPayout: number;
  eligibleCount: number;
  creatorPayouts: { username: string; displayName: string; payout: number; score10: number; isEligible: boolean }[];
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
  monthlyPayouts: MonthlyPayout[];
  allocationsByMonth: {
    month: string;
    label: string;
    isCurrent: boolean;
    allocations: Allocation[];
    totalAllocated: number;
    eligibleCreators: number;
    ineligibleCreators: number;
  }[];
  referralTrends: {
    month: string;
    label: string;
    signups: number;
    volume: number;
    activeReferrals: number;
    byCreator: Record<string, { count: number; volume: number }>;
  }[];
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
  const [payoutMonth, setPayoutMonth] = useState<string | null>(null);

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

      {/* ===== SECTION: Referral Trends ===== */}
      {data.referralTrends.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-4">Referral Trends</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Signups chart */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h4 className="text-sm font-semibold mb-4">Referral Signups by Month</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.referralTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickFormatter={(v) => v.split(" ")[0]} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="signups" name="Total Signups" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="activeReferrals" name="Active (traded)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Volume chart */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h4 className="text-sm font-semibold mb-4">Referred Volume by Month</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.referralTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickFormatter={(v) => v.split(" ")[0]} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${formatNum(v)}`} />
                  <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                  <Bar dataKey="volume" name="Volume" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Referral trends table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden mb-10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold">Month</th>
                  <th className="text-right px-4 py-3 font-semibold">Signups</th>
                  <th className="text-right px-4 py-3 font-semibold">Active</th>
                  <th className="text-right px-4 py-3 font-semibold">Volume</th>
                  <th className="text-left px-4 py-3 font-semibold">Top Referrer</th>
                </tr>
              </thead>
              <tbody>
                {data.referralTrends.map((rt) => {
                  const topReferrer = Object.entries(rt.byCreator).sort((a, b) => b[1].count - a[1].count)[0];
                  return (
                    <tr key={rt.month} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{rt.label}</td>
                      <td className="px-4 py-3 text-right">{rt.signups}</td>
                      <td className="px-4 py-3 text-right">{rt.activeReferrals}</td>
                      <td className="px-4 py-3 text-right">${formatNum(rt.volume)}</td>
                      <td className="px-4 py-3">
                        {topReferrer ? `@${topReferrer[0]} (${topReferrer[1].count})` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-semibold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{data.referralTrends.reduce((s, r) => s + r.signups, 0)}</td>
                  <td className="px-4 py-3 text-right">{data.referralTrends.reduce((s, r) => s + r.activeReferrals, 0)}</td>
                  <td className="px-4 py-3 text-right">${formatNum(data.referralTrends.reduce((s, r) => s + r.volume, 0))}</td>
                  <td className="px-4 py-3">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

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
      <h3 className="text-lg font-semibold mb-4">Payout Allocation</h3>

      {/* Month tabs */}
      {data.allocationsByMonth.length > 0 && (() => {
        const activeMonth = payoutMonth
          ? data.allocationsByMonth.find((m) => m.month === payoutMonth)
          : data.allocationsByMonth.find((m) => !m.isCurrent) || data.allocationsByMonth[0];
        if (!activeMonth) return null;
        const am = activeMonth;

        return (
          <>
            <div className="flex gap-2 mb-4">
              {data.allocationsByMonth.map((m) => (
                <button
                  key={m.month}
                  onClick={() => setPayoutMonth(m.month)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    am.month === m.month
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-border"
                  }`}
                >
                  {m.isCurrent ? `${m.label} (Current)` : m.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="text-sm text-muted-foreground">Total Allocated</div>
                <div className="text-2xl font-bold mt-1">${am.totalAllocated.toLocaleString()}</div>
              </div>
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="text-sm text-muted-foreground">Eligible</div>
                <div className="text-2xl font-bold mt-1 text-success">{am.eligibleCreators}</div>
              </div>
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="text-sm text-muted-foreground">Not Eligible</div>
                <div className="text-2xl font-bold mt-1 text-destructive">{am.ineligibleCreators}</div>
              </div>
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="text-sm text-muted-foreground">Avg Payout</div>
                <div className="text-2xl font-bold mt-1">
                  ${am.eligibleCreators > 0 ? Math.round(am.totalAllocated / am.eligibleCreators) : 0}
                </div>
              </div>
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
                  {am.allocations.map((a, i) => (
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
                      <td className="px-4 py-3 text-right">{a.trendleMentions}</td>
                      <td className="px-4 py-3 text-right">{formatNum(a.totalImpressions)}</td>
                      <td className="px-4 py-3 text-right">{formatNum(a.totalEngagement)}</td>
                      <td className="px-4 py-3 text-right">{a.interactionCount}</td>
                      <td className="px-4 py-3 text-right">{a.referralCount}</td>
                      <td className="px-4 py-3 text-right">{a.referralVolume > 0 ? `$${formatNum(a.referralVolume)}` : "-"}</td>
                      <td className="px-4 py-3 text-right font-semibold">{a.score10.toFixed(1)}</td>
                      <td className="px-4 py-3 text-center">
                        {a.isExcluded ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Excluded</span>
                        ) : a.isEligible ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Yes</span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">No activity</span>
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
                    <td className="px-4 py-3 text-right">{am.allocations.reduce((s, a) => s + a.trendleMentions, 0)}</td>
                    <td className="px-4 py-3 text-right">{formatNum(am.allocations.reduce((s, a) => s + a.totalImpressions, 0))}</td>
                    <td className="px-4 py-3 text-right">{formatNum(am.allocations.reduce((s, a) => s + a.totalEngagement, 0))}</td>
                    <td className="px-4 py-3 text-right">{am.allocations.reduce((s, a) => s + a.interactionCount, 0)}</td>
                    <td className="px-4 py-3 text-right">{am.allocations.reduce((s, a) => s + a.referralCount, 0)}</td>
                    <td className="px-4 py-3 text-right">${formatNum(am.allocations.reduce((s, a) => s + a.referralVolume, 0))}</td>
                    <td className="px-4 py-3 text-right">-</td>
                    <td className="px-4 py-3 text-center">{am.eligibleCreators}/{am.allocations.length}</td>
                    <td className="px-4 py-3 text-right text-success">${am.totalAllocated.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        );
      })()}

      {/* ===== SECTION 5: Monthly Payout History ===== */}
      {data.monthlyPayouts.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mt-10 mb-4">Monthly Payout History</h3>

          {/* Total payouts chart */}
          <div className="bg-card rounded-xl border border-border p-5 mb-6">
            <h4 className="text-sm font-semibold mb-4">Total Payouts by Month</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.monthlyPayouts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickFormatter={(v) => v.split(" ")[0]} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                <Bar dataKey="totalPayout" name="Total Payout" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly payout summary table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold">Month</th>
                  <th className="text-right px-4 py-3 font-semibold">Eligible</th>
                  <th className="text-right px-4 py-3 font-semibold">Total Payout</th>
                  <th className="text-right px-4 py-3 font-semibold">Avg Payout</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyPayouts.map((mp) => (
                  <tr key={mp.month} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{mp.label}</td>
                    <td className="px-4 py-3 text-right">{mp.eligibleCount}</td>
                    <td className="px-4 py-3 text-right font-semibold text-success">${mp.totalPayout.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">${mp.eligibleCount > 0 ? Math.round(mp.totalPayout / mp.eligibleCount) : 0}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-semibold">
                  <td className="px-4 py-3">All Time</td>
                  <td className="px-4 py-3 text-right">-</td>
                  <td className="px-4 py-3 text-right text-success">${data.monthlyPayouts.reduce((s, mp) => s + mp.totalPayout, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">-</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Per-creator payout history table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <h4 className="text-sm font-semibold px-4 pt-4 pb-2">Creator Payout History</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-semibold sticky left-0 bg-muted/50">Creator</th>
                    {data.monthlyPayouts.map((mp) => (
                      <th key={mp.month} className="text-right px-4 py-3 font-semibold whitespace-nowrap">
                        {mp.label.split(" ")[0]}
                      </th>
                    ))}
                    <th className="text-right px-4 py-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Get all unique creators across all months
                    const creatorNames = [...new Set(
                      data.monthlyPayouts.flatMap((mp) => mp.creatorPayouts.map((cp) => cp.username))
                    )];
                    return creatorNames.map((username) => {
                      const payouts = data.monthlyPayouts.map((mp) => {
                        const cp = mp.creatorPayouts.find((c) => c.username === username);
                        return cp?.payout || 0;
                      });
                      const total = payouts.reduce((s, p) => s + p, 0);
                      if (total === 0 && payouts.every((p) => p === 0)) return null;
                      const display = data.monthlyPayouts[0]?.creatorPayouts.find((c) => c.username === username);
                      return (
                        <tr key={username} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 font-medium sticky left-0 bg-card">
                            @{username}
                            <span className="text-xs text-muted-foreground ml-1">{display?.displayName}</span>
                          </td>
                          {payouts.map((p, i) => (
                            <td key={i} className="px-4 py-3 text-right">
                              {p > 0 ? (
                                <span className="text-success font-medium">${p}</span>
                              ) : (
                                <span className="text-muted-foreground">$0</span>
                              )}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-right font-bold">${total}</td>
                        </tr>
                      );
                    }).filter(Boolean);
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
