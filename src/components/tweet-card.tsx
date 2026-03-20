"use client";

export function TweetCard({
  text,
  author,
  postedAt,
  impressions,
  likes,
  retweets,
  tweetId,
}: {
  text: string;
  author?: { username: string; displayName: string; profileImage?: string | null };
  postedAt: string;
  impressions: number;
  likes: number;
  retweets: number;
  tweetId?: string;
}) {
  const date = new Date(postedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:border-accent transition-colors">
      {author && (
        <div className="flex items-center gap-2 mb-3">
          {author.profileImage && (
            <img
              src={author.profileImage}
              alt={author.username}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div>
            <p className="text-sm font-semibold">{author.displayName}</p>
            <p className="text-xs text-muted-foreground">@{author.username}</p>
          </div>
        </div>
      )}
      <p className="text-sm leading-relaxed mb-3">{text}</p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{date}</span>
        <span>{formatNum(impressions)} impressions</span>
        <span>{formatNum(likes)} likes</span>
        <span>{formatNum(retweets)} retweets</span>
        {tweetId && (
          <a
            href={`https://x.com/i/status/${tweetId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline ml-auto"
          >
            View on X
          </a>
        )}
      </div>
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}
