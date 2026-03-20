"use client";

import { useEffect, useState } from "react";
import type { TrendleTweetWithInteractions } from "@/types";

export default function TrendleTweetsPage() {
  const [tweets, setTweets] = useState<TrendleTweetWithInteractions[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">@trendlefi Tweets</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Tweets from @trendlefi and which creators interacted with them.
      </p>

      {tweets.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">
            No tweets synced yet. Click &quot;Sync Now&quot; on the dashboard to
            fetch data.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {tweets.map((t) => (
            <div
              key={t.id}
              className="bg-card rounded-xl border border-border p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{t.text}</p>
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
                  {new Date(t.postedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span>{t.impressions.toLocaleString()} impressions</span>
                <span>{t.likes} likes</span>
                <span>{t.retweets} retweets</span>
                <span>{t.replies} replies</span>
              </div>

              {t.interactions.length > 0 && (
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Creator Interactions ({t.interactions.length})
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
  );
}
