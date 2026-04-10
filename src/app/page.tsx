"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
import { StatCard } from "@/components/stat-card";
import { ImpressionsChart } from "@/components/impressions-chart";
import type { DashboardStats } from "@/types";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
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

interface ReferralTrend {
  month: string;
  label: string;
  signups: number;
  volume: number;
  activeReferrals: number;
  byCreator: Record<string, { count: number; volume: number }>;
}

interface TeamData {
  monthlyTotals: MonthlyTotal[];
  creatorMonthly: CreatorMonthly[];
  referralTrends: ReferralTrend[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);

  const fetchData = useCallback(async (week?: string) => {
    try {
      const url = week ? `/api/dashboard?week=${week}` : "/api/dashboard";
      const [dashRes, teamRes] = await Promise.all([
        fetch(url),
        fetch("/api/allocations"),
      ]);
      setStats(await dashRes.json());
      setTeamData(await teamRes.json());
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedWeek || undefined);
  }, [fetchData, selectedWeek]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load dashboard data.</p>
      </div>
    );
  }

  const activeMonths = teamData?.monthlyTotals.filter((m) => m.score > 0) || [];
  const creatorForDetail = selectedCreator
    ? teamData?.creatorMonthly.find((c) => c.id === selectedCreator)
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex items-center gap-3">
          <select
            value={selectedWeek}
            onChange={(e) => {
              setSelectedWeek(e.target.value);
              setLoading(true);
            }}
            className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Time (from Mar 1)</option>
            {(stats.weeks || []).map(
              (w: { start: string; label: string }) => (
                <option key={w.start} value={w.start}>
                  {w.label}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Creators" value={stats.totalCreators} />
        <StatCard label="Trendle Mentions" value={stats.totalTrendleMentions} />
        <StatCard label="Total Impressions" value={formatNum(stats.totalImpressions)} />
        <StatCard label="Total Engagement" value={formatNum(stats.totalEngagement)} sub="likes + retweets + replies + quotes" />
        <StatCard label="Total Invites" value={stats.totalReferrals || 0} />
        <StatCard label="Referred Volume" value={"$" + (stats.totalReferredVolume || 0).toFixed(2)} />
      </div>

      {/* Weekly impressions */}
      <div className="mb-8">
        <ImpressionsChart data={stats.impressionsOverTime} />
      </div>

      {/* ===== Program Performance by Month ===== */}
      {activeMonths.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-4">Program Performance by Month</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
        </>
      )}

      {/* ===== Referral Trends ===== */}
      {teamData && teamData.referralTrends.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-4">Referral Trends</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-card rounded-xl border border-border p-5">
              <h4 className="text-sm font-semibold mb-4">Referral Signups by Month</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={teamData.referralTrends}>
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

            <div className="bg-card rounded-xl border border-border p-5">
              <h4 className="text-sm font-semibold mb-4">Referred Volume by Month</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={teamData.referralTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickFormatter={(v) => v.split(" ")[0]} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${formatNum(v)}`} />
                  <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                  <Bar dataKey="volume" name="Volume" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

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
                {teamData.referralTrends.map((rt) => {
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
                  <td className="px-4 py-3 text-right">{teamData.referralTrends.reduce((s, r) => s + r.signups, 0)}</td>
                  <td className="px-4 py-3 text-right">{teamData.referralTrends.reduce((s, r) => s + r.activeReferrals, 0)}</td>
                  <td className="px-4 py-3 text-right">${formatNum(teamData.referralTrends.reduce((s, r) => s + r.volume, 0))}</td>
                  <td className="px-4 py-3">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {/* ===== Creator Performance by Month ===== */}
      {teamData && teamData.creatorMonthly.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-4">Creator Performance by Month</h3>

          <div className="flex flex-wrap gap-2 mb-6">
            {teamData.creatorMonthly.map((c) => (
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
        </>
      )}

      {/* ===== All Creators ===== */}
      {stats.topCreators.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-4">All Creators</h3>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold">#</th>
                  <th className="text-left px-4 py-3 font-semibold">Creator</th>
                  <th className="text-right px-4 py-3 font-semibold">Impressions</th>
                  <th className="text-right px-4 py-3 font-semibold">Engagement</th>
                  <th className="text-right px-4 py-3 font-semibold">Trendle Posts</th>
                  <th className="text-right px-4 py-3 font-semibold">Interactions</th>
                </tr>
              </thead>
              <tbody>
                {stats.topCreators.map((c, i) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/creators/${c.id}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        {c.profileImage && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.profileImage} alt="" className="w-6 h-6 rounded-full" />
                        )}
                        <div>
                          <div className="font-medium">{c.displayName}</div>
                          <div className="text-xs text-muted-foreground">@{c.username}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">{formatNum(c.totalImpressions)}</td>
                    <td className="px-4 py-3 text-right">{formatNum(c.totalEngagement)}</td>
                    <td className="px-4 py-3 text-right">{c.trendleMentions}</td>
                    <td className="px-4 py-3 text-right">{c.interactionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
