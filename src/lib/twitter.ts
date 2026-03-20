import { TwitterApi } from "twitter-api-v2";

// March 1, 2025 — program tracking start date
export const TRACKING_START = "2026-03-01T00:00:00Z";

let client: TwitterApi | null = null;

export function getTwitterClient(): TwitterApi {
  if (!client) {
    const token = process.env.X_API_BEARER_TOKEN;
    if (!token) {
      throw new Error("X_API_BEARER_TOKEN is not set");
    }
    client = new TwitterApi(token);
  }
  return client;
}

export async function lookupUser(username: string) {
  const api = getTwitterClient();
  const user = await api.v2.userByUsername(username, {
    "user.fields": ["public_metrics", "profile_image_url", "name"],
  });
  return user.data;
}

export async function getUserTweets(
  userId: string,
  sinceId?: string,
  startTime?: string,
  excludeReplies?: boolean,
  maxPages: number = 1
) {
  const api = getTwitterClient();
  const params: Record<string, unknown> = {
    max_results: 100,
    "tweet.fields": [
      "public_metrics",
      "created_at",
      "referenced_tweets",
      "in_reply_to_user_id",
    ],
  };
  if (sinceId) params.since_id = sinceId;
  if (startTime && !sinceId) params.start_time = startTime;
  if (excludeReplies) params.exclude = ["replies"];

  const paginator = await api.v2.userTimeline(userId, params);
  const allTweets = [...(paginator.data?.data || [])];

  // Paginate to get more tweets
  let page = 1;
  while (page < maxPages && !paginator.done) {
    try {
      await paginator.fetchNext();
      const nextData = paginator.data?.data || [];
      if (nextData.length === 0) break;
      // The paginator accumulates, so get only new ones
      const newTweets = nextData.slice(allTweets.length);
      if (newTweets.length === 0) break;
      allTweets.push(...newTweets);
      page++;
    } catch {
      break;
    }
  }

  return allTweets;
}

export async function searchRecentTweets(query: string, sinceId?: string) {
  const api = getTwitterClient();
  const params: Record<string, unknown> = {
    max_results: 100,
    "tweet.fields": ["public_metrics", "created_at", "author_id"],
  };
  if (sinceId) params.since_id = sinceId;

  const result = await api.v2.search(query, params);
  return result.data?.data || [];
}

export async function getRetweetedBy(tweetId: string): Promise<string[]> {
  const api = getTwitterClient();
  const result = await api.v2.tweetRetweetedBy(tweetId, {
    "user.fields": ["id"],
  });
  return result.data?.map((u) => u.id) || [];
}

export async function getLikingUsers(tweetId: string): Promise<string[]> {
  const api = getTwitterClient();
  const result = await api.v2.tweetLikedBy(tweetId, {
    "user.fields": ["id"],
  });
  return result.data?.map((u) => u.id) || [];
}
