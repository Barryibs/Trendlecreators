"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { CreatorWithMetrics } from "@/types";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<CreatorWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCreators = useCallback(async () => {
    try {
      const res = await fetch("/api/creators");
      const data = await res.json();
      setCreators(data);
    } catch (err) {
      console.error("Failed to load creators:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Creators</h2>

      {loading ? (
        <p className="text-muted-foreground">Loading creators...</p>
      ) : creators.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">No creators in the program yet.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Creator
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Followers
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Trendle Mentions
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Impressions
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Engagement
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                  Interactions
                </th>
              </tr>
            </thead>
            <tbody>
              {creators.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/creators/${c.id}`}
                      className="flex items-center gap-3 hover:text-primary transition-colors"
                    >
                      {c.profileImage && (
                        <img
                          src={c.profileImage}
                          alt={c.username}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium">{c.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          @{c.username}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatNum(c.followerCount)}
                  </td>
                  <td className="px-4 py-3 text-sm">{c.trendleMentions}</td>
                  <td className="px-4 py-3 text-sm">
                    {formatNum(c.totalImpressions)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatNum(c.totalEngagement)}
                  </td>
                  <td className="px-4 py-3 text-sm">{c.interactionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
