"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { TweetCard } from "@/components/tweet-card";
import { ImpressionsChart } from "@/components/impressions-chart";
import type { DashboardStats } from "@/types";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string>("");

  const fetchData = useCallback(
    async (week?: string) => {
      try {
        const url = week
          ? `/api/dashboard?week=${week}`
          : "/api/dashboard";
        const res = await fetch(url);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Creators" value={stats.totalCreators} />
        <StatCard
          label="Trendle Mentions"
          value={stats.totalTrendleMentions}
        />
        <StatCard
          label="Total Impressions"
          value={formatNum(stats.totalImpressions)}
        />
        <StatCard
          label="Total Engagement"
          value={formatNum(stats.totalEngagement)}
          sub="likes + retweets + replies + quotes"
        />
        <StatCard
          label="Total Invites"
          value={stats.totalReferrals || 0}
        />
        <StatCard
          label="Referred Volume"
          value={"$" + (stats.totalReferredVolume || 0).toFixed(2)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ImpressionsChart data={stats.impressionsOverTime} />
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold mb-4">Top Creators</h3>
          <div className="flex flex-col gap-3">
            {stats.topCreators.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No creators added yet.
              </p>
            )}
            {stats.topCreators.map((c, i) => (
              <Link
                key={c.id}
                href={`/creators/${c.id}`}
                className="flex items-center gap-3 hover:bg-muted rounded-lg px-2 py-1 -mx-2 transition-colors"
              >
                <span className="text-xs text-muted-foreground w-5">
                  {i + 1}.
                </span>
                {c.profileImage && (
                  <img
                    src={c.profileImage}
                    alt={c.username}
                    className="w-7 h-7 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    @{c.username}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {formatNum(c.totalImpressions)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">
          Recent Trendle Mentions
          {selectedWeek && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (filtered)
            </span>
          )}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {stats.recentMentions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No mentions found{selectedWeek ? " for this week" : ""}. Add
              creators and sync to see data.
            </p>
          )}
          {stats.recentMentions.map((t) => (
            <TweetCard
              key={t.id}
              text={t.text}
              author={t.creator}
              postedAt={t.postedAt}
              impressions={t.impressions}
              likes={t.likes}
              retweets={t.retweets}
              tweetId={t.tweetId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
