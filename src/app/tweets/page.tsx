"use client";

import { useEffect, useState } from "react";
import type { TrendleTweetWithInteractions } from "@/types";

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function getWeekMonday(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().split("T")[0];
}

function formatWeekLabel(mondayStr: string): string {
  const monday = new Date(mondayStr + "T00:00:00Z");
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return `Week of ${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${sunday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

interface WeekSummary {
  weekKey: string;
  label: string;
  tweetCount: number;
  totalImpressions: number;
  totalInteractions: number;
  creatorBreakdown: {
    username: string;
    profileImage: string | null;
    comments: number;
    retweets: number;
    likes: number;
    total: number;
  }[];
  tweets: TrendleTweetWithInteractions[];
}

function groupTweetsByWeek(
  tweets: TrendleTweetWithInteractions[]
): WeekSummary[] {
  const groups = new Map<string, TrendleTweetWithInteractions[]>();

  for (const t of tweets) {
    const weekKey = getWeekMonday(t.postedAt);
    const existing = groups.get(weekKey) || [];
    existing.push(t);
    groups.set(weekKey, existing);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([weekKey, weekTweets]) => {
      const totalImpressions = weekTweets.reduce(
        (s, t) => s + t.impressions,
        0
      );
      const allInteractions = weekTweets.flatMap((t) => t.interactions);
      const totalInteractions = allInteractions.length;

      // Creator breakdown
      const creatorMap = new Map<
        string,
        {
          username: string;
          profileImage: string | null;
          comments: number;
          retweets: number;
          likes: number;
        }
      >();

      for (const int of allInteractions) {
        const existing = creatorMap.get(int.creator.username) || {
          username: int.creator.username,
          profileImage: int.creator.profileImage,
          comments: 0,
          retweets: 0,
          likes: 0,
        };
        if (int.type === "comment") existing.comments++;
        else if (int.type === "retweet") existing.retweets++;
        else if (int.type === "like") existing.likes++;
        creatorMap.set(int.creator.username, existing);
      }

      const creatorBreakdown = Array.from(creatorMap.values())
        .map((c) => ({
          ...c,
          total: c.comments + c.retweets + c.likes,
        }))
        .sort((a, b) => b.total - a.total);

      return {
        weekKey,
        label: formatWeekLabel(weekKey),
        tweetCount: weekTweets.length,
        totalImpressions,
        totalInteractions,
        creatorBreakdown,
        tweets: weekTweets.sort(
          (a, b) =>
            new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
        ),
      };
    });
}

export default function TrendleTweetsPage() {
  const [tweets, setTweets] = useState<TrendleTweetWithInteractions[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tweets");
        setTweets(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <p className="text-muted-foreground">Loading tweets...</p>;
  }

  const weeks = groupTweetsByWeek(tweets);

  // Overall totals
  const totalPosts = tweets.length;
  const totalInteractions = tweets.reduce(
    (s, t) => s + t.interactions.length,
    0
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">@trendlefi Tweets</h2>

      {tweets.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">No tweets synced yet.</p>
        </div>
      ) : (
        <>
          {/* Weekly analytics summary */}
          <div className="bg-card rounded-xl border border-border p-6 mb-8">
            <h3 className="text-sm font-semibold mb-4">
              Weekly Summary
            </h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Week
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase text-right">
                    Posts
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase text-right">
                    Views
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase text-right">
                    Interactions
                  </th>
                  <th className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Creator Engagement
                  </th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((w) => (
                  <tr
                    key={w.weekKey}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-3 py-3 text-sm font-medium">
                      {w.label}
                    </td>
                    <td className="px-3 py-3 text-sm text-right">
                      {w.tweetCount}
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-medium">
                      {formatNum(w.totalImpressions)}
                    </td>
                    <td className="px-3 py-3 text-sm text-right">
                      {w.totalInteractions}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {w.creatorBreakdown.map((c) => (
                          <div
                            key={c.username}
                            className="flex items-center gap-1 bg-muted rounded px-2 py-0.5"
                          >
                            {c.profileImage && (
                              <img
                                src={c.profileImage}
                                alt={c.username}
                                className="w-4 h-4 rounded-full"
                              />
                            )}
                            <span className="text-xs font-medium">
                              @{c.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {c.comments > 0 && `${c.comments}c`}
                              {c.retweets > 0 &&
                                `${c.comments > 0 ? " " : ""}${c.retweets}rt`}
                              {c.likes > 0 &&
                                `${c.comments + c.retweets > 0 ? " " : ""}${c.likes}l`}
                            </span>
                          </div>
                        ))}
                        {w.creatorBreakdown.length === 0 && (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-semibold">
                  <td className="px-3 py-3 text-sm">Total</td>
                  <td className="px-3 py-3 text-sm text-right">
                    {totalPosts}
                  </td>
                  <td className="px-3 py-3 text-sm text-right">
                    {formatNum(
                      tweets.reduce((s, t) => s + t.impressions, 0)
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm text-right">
                    {totalInteractions}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {weeks.reduce(
                      (s, w) => s + w.creatorBreakdown.length,
                      0
                    )}{" "}
                    creators engaged
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tweets grouped by week */}
          <div className="flex flex-col gap-8">
            {weeks.map((w) => (
              <div key={w.weekKey}>
                <button
                  onClick={() =>
                    setExpandedWeek(
                      expandedWeek === w.weekKey ? null : w.weekKey
                    )
                  }
                  className="w-full flex items-center justify-between mb-3 pb-2 border-b border-border hover:text-primary transition-colors"
                >
                  <h3 className="text-sm font-semibold">{w.label}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      {w.tweetCount} post{w.tweetCount !== 1 ? "s" : ""}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatNum(w.totalImpressions)} views
                    </span>
                    <span>
                      {w.totalInteractions} interaction
                      {w.totalInteractions !== 1 ? "s" : ""}
                    </span>
                    <span className="text-primary">
                      {expandedWeek === w.weekKey ? "Collapse" : "Expand"}
                    </span>
                  </div>
                </button>

                {expandedWeek === w.weekKey && (
                  <div className="flex flex-col gap-4">
                    {w.tweets.map((t) => (
                      <div
                        key={t.id}
                        className="bg-card rounded-xl border border-border p-6"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed">
                              {t.text}
                            </p>
                          </div>
                          <a
                            href={`https://x.com/trendlefi/status/${t.tweetId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline ml-4 shrink-0"
                          >
                            View on X
                          </a>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                          <span>
                            {new Date(t.postedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                          <span>
                            {t.impressions.toLocaleString()} impressions
                          </span>
                          <span>{t.likes} likes</span>
                          <span>{t.retweets} retweets</span>
                          <span>{t.replies} replies</span>
                        </div>

                        {t.interactions.length > 0 && (
                          <div className="border-t border-border pt-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">
                              Creator Interactions (
                              {t.interactions.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {t.interactions.map((int) => (
                                <div
                                  key={int.id}
                                  className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5"
                                >
                                  {int.creator.profileImage && (
                                    <img
                                      src={int.creator.profileImage}
                                      alt={int.creator.username}
                                      className="w-5 h-5 rounded-full"
                                    />
                                  )}
                                  <span className="text-xs font-medium">
                                    @{int.creator.username}
                                  </span>
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded ${
                                      int.type === "like"
                                        ? "bg-red-100 text-red-700"
                                        : int.type === "retweet"
                                          ? "bg-green-100 text-green-700"
                                          : int.type === "comment"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-purple-100 text-purple-700"
                                    }`}
                                  >
                                    {int.type}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
