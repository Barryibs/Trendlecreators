import { config } from "dotenv";
config();

// We need to set up the @/ path alias for sync.ts imports
// Instead, let's call the sync API endpoint or run the sync inline
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql/web";
import { TwitterApi } from "twitter-api-v2";

// --- Setup ---
const url = process.env.TURSO_DATABASE_URL || "";
const authToken = process.env.TURSO_AUTH_TOKEN || "";
const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

const TRACKING_START = "2026-03-01T00:00:00Z";

const twitterClient = new TwitterApi(process.env.X_API_BEARER_TOKEN!);

const TRENDLE_KEYWORDS = [
  "trendle",
  "@trendlefi",
  "trendlefi",
  "trendle.fi",
  "trendlemaxx",
  "trendlemaxxx",
  "trendlemaxxing",
];

function mentionsTrendle(text: string): boolean {
  const lower = text.toLowerCase();
  return TRENDLE_KEYWORDS.some((kw) => lower.includes(kw));
}

async function log(syncType: string, status: string, tweetsRead: number, details?: string) {
  console.log(`[${syncType}] ${status} — ${tweetsRead} tweets${details ? ` (${details})` : ""}`);
  await prisma.syncLog.create({ data: { syncType, status, tweetsRead, details } });
}

async function getUserTweets(
  userId: string,
  sinceId?: string,
  startTime?: string,
  excludeReplies?: boolean,
  maxPages: number = 1
) {
  const params: Record<string, unknown> = {
    max_results: 100,
    "tweet.fields": ["public_metrics", "created_at", "referenced_tweets", "in_reply_to_user_id"],
  };
  if (sinceId) params.since_id = sinceId;
  if (startTime && !sinceId) params.start_time = startTime;
  if (excludeReplies) params.exclude = ["replies"];

  const paginator = await twitterClient.v2.userTimeline(userId, params);
  const allTweets = [...(paginator.data?.data || [])];

  let page = 1;
  while (page < maxPages && !paginator.done) {
    try {
      await paginator.fetchNext();
      const nextData = paginator.data?.data || [];
      if (nextData.length === 0) break;
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

async function searchRecentTweets(query: string, sinceId?: string) {
  const params: Record<string, unknown> = {
    max_results: 100,
    "tweet.fields": ["public_metrics", "created_at", "author_id"],
  };
  if (sinceId) params.since_id = sinceId;
  const result = await twitterClient.v2.search(query, params);
  return result.data?.data || [];
}

async function getRetweetedBy(tweetId: string): Promise<string[]> {
  const result = await twitterClient.v2.tweetRetweetedBy(tweetId, { "user.fields": ["id"] });
  return result.data?.map((u) => u.id) || [];
}

async function getLikingUsers(tweetId: string): Promise<string[]> {
  const result = await twitterClient.v2.tweetLikedBy(tweetId, { "user.fields": ["id"] });
  return result.data?.map((u) => u.id) || [];
}

// --- Sync Functions ---

async function syncTrendleTweets() {
  const trendleId = process.env.TRENDLE_TWITTER_ID;
  if (!trendleId) { await log("trendle_tweets", "error", 0, "TRENDLE_TWITTER_ID not set"); return; }

  try {
    const lastTweet = await prisma.trendleTweet.findFirst({ orderBy: { postedAt: "desc" } });
    const tweets = await getUserTweets(trendleId, lastTweet?.tweetId || undefined, TRACKING_START, true);

    let count = 0;
    for (const tweet of tweets) {
      const isReply = tweet.referenced_tweets?.some((ref) => ref.type === "replied_to");
      if (isReply) continue;
      await prisma.trendleTweet.upsert({
        where: { tweetId: tweet.id },
        update: {
          impressions: tweet.public_metrics?.impression_count || 0,
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          replies: tweet.public_metrics?.reply_count || 0,
        },
        create: {
          tweetId: tweet.id, text: tweet.text,
          postedAt: new Date(tweet.created_at || Date.now()),
          impressions: tweet.public_metrics?.impression_count || 0,
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          replies: tweet.public_metrics?.reply_count || 0,
        },
      });
      count++;
    }
    await log("trendle_tweets", "success", count);
  } catch (error) {
    await log("trendle_tweets", "error", 0, error instanceof Error ? error.message : String(error));
  }
}

async function syncCreatorTimelines() {
  const creators = await prisma.creator.findMany();
  for (const creator of creators) {
    try {
      const lastTweet = await prisma.tweet.findFirst({
        where: { creatorId: creator.id }, orderBy: { postedAt: "desc" },
      });
      const tweets = await getUserTweets(creator.twitterId, lastTweet?.tweetId || undefined, TRACKING_START);
      const trendleTweetIds = new Set(
        (await prisma.trendleTweet.findMany({ select: { tweetId: true } })).map((t) => t.tweetId)
      );

      let count = 0;
      for (const tweet of tweets) {
        const isTrendle = mentionsTrendle(tweet.text);
        const quotedRef = tweet.referenced_tweets?.find((ref) => ref.type === "quoted");
        const isQuoteTweet = quotedRef ? trendleTweetIds.has(quotedRef.id) : false;
        const quotedTweetId = isQuoteTweet ? quotedRef!.id : null;

        await prisma.tweet.upsert({
          where: { tweetId: tweet.id },
          update: {
            impressions: tweet.public_metrics?.impression_count || 0,
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
            quotes: tweet.public_metrics?.quote_count || 0,
            mentionsTrendle: isTrendle || isQuoteTweet,
            isQuoteTweet, quotedTweetId,
          },
          create: {
            tweetId: tweet.id, creatorId: creator.id, text: tweet.text,
            postedAt: new Date(tweet.created_at || Date.now()),
            impressions: tweet.public_metrics?.impression_count || 0,
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
            quotes: tweet.public_metrics?.quote_count || 0,
            mentionsTrendle: isTrendle || isQuoteTweet,
            isQuoteTweet, quotedTweetId,
          },
        });
        count++;
      }
      await log("creator_tweets", "success", count, creator.username);
    } catch (error) {
      await log("creator_tweets", "error", 0, `${creator.username}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function syncTrendleMentions() {
  try {
    const tweets = await searchRecentTweets("Trendle OR @trendlefi OR trendlefi OR trendle.fi OR trendlemaxx");
    const creators = await prisma.creator.findMany();
    const creatorMap = new Map(creators.map((c) => [c.twitterId, c]));

    let count = 0;
    for (const tweet of tweets) {
      const creator = creatorMap.get(tweet.author_id || "");
      if (!creator) continue;
      await prisma.tweet.upsert({
        where: { tweetId: tweet.id },
        update: {
          impressions: tweet.public_metrics?.impression_count || 0,
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          replies: tweet.public_metrics?.reply_count || 0,
          mentionsTrendle: true,
        },
        create: {
          tweetId: tweet.id, creatorId: creator.id, text: tweet.text,
          postedAt: new Date(tweet.created_at || Date.now()),
          impressions: tweet.public_metrics?.impression_count || 0,
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          replies: tweet.public_metrics?.reply_count || 0,
          mentionsTrendle: true,
        },
      });
      count++;
    }
    await log("search_mentions", "success", count);
  } catch (error) {
    await log("search_mentions", "error", 0, error instanceof Error ? error.message : String(error));
  }
}

async function refreshMetrics() {
  const creators = await prisma.creator.findMany();
  const trendleTweetIds = new Set(
    (await prisma.trendleTweet.findMany({ select: { tweetId: true } })).map((t) => t.tweetId)
  );

  let updated = 0;
  for (const creator of creators) {
    try {
      const tweets = await getUserTweets(creator.twitterId, undefined, TRACKING_START, false, 5);
      for (const tweet of tweets) {
        const isTrendle = mentionsTrendle(tweet.text);
        const quotedRef = tweet.referenced_tweets?.find((ref) => ref.type === "quoted");
        const isQuoteTweet = quotedRef ? trendleTweetIds.has(quotedRef.id) : false;
        const hasUrl = tweet.text.toLowerCase().includes("trendle.fi");

        if (!isTrendle && !isQuoteTweet && !hasUrl) continue;

        await prisma.tweet.upsert({
          where: { tweetId: tweet.id },
          update: {
            impressions: tweet.public_metrics?.impression_count || 0,
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
            quotes: tweet.public_metrics?.quote_count || 0,
            mentionsTrendle: true, isQuoteTweet,
            quotedTweetId: isQuoteTweet ? quotedRef!.id : undefined,
          },
          create: {
            tweetId: tweet.id, creatorId: creator.id, text: tweet.text,
            postedAt: new Date(tweet.created_at || Date.now()),
            impressions: tweet.public_metrics?.impression_count || 0,
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
            quotes: tweet.public_metrics?.quote_count || 0,
            mentionsTrendle: true, isQuoteTweet,
            quotedTweetId: isQuoteTweet ? quotedRef!.id : null,
          },
        });
        updated++;
      }
    } catch { /* skip */ }
  }

  // Also refresh Trendle tweet metrics
  const trendleId = process.env.TRENDLE_TWITTER_ID;
  if (trendleId) {
    try {
      const tweets = await getUserTweets(trendleId, undefined, TRACKING_START, true, 5);
      for (const tweet of tweets) {
        const isReply = tweet.referenced_tweets?.some((ref) => ref.type === "replied_to");
        if (isReply) continue;
        await prisma.trendleTweet.upsert({
          where: { tweetId: tweet.id },
          update: {
            impressions: tweet.public_metrics?.impression_count || 0,
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
          },
          create: {
            tweetId: tweet.id, text: tweet.text,
            postedAt: new Date(tweet.created_at || Date.now()),
            impressions: tweet.public_metrics?.impression_count || 0,
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
          },
        });
      }
    } catch { /* skip */ }
  }

  await log("refresh_metrics", "success", updated, `${updated} tweets updated/found`);
}

async function detectInteractions() {
  const creators = await prisma.creator.findMany();
  const creatorIdSet = new Set(creators.map((c) => c.twitterId));
  const creatorByTwitterId = new Map(creators.map((c) => [c.twitterId, c]));
  const trendleTweets = await prisma.trendleTweet.findMany({ orderBy: { postedAt: "desc" } });

  let totalFound = 0;

  // 1. RETWEETS
  for (const tt of trendleTweets) {
    try {
      const retweeters = await getRetweetedBy(tt.tweetId);
      for (const retweeterId of retweeters) {
        if (!creatorIdSet.has(retweeterId)) continue;
        const creator = creatorByTwitterId.get(retweeterId)!;
        await prisma.interaction.upsert({
          where: { creatorId_trendleTweetId_type: { creatorId: creator.id, trendleTweetId: tt.id, type: "retweet" } },
          update: {},
          create: { creatorId: creator.id, trendleTweetId: tt.id, type: "retweet" },
        });
        totalFound++;
      }
    } catch { /* skip */ }
  }

  // 2. LIKES
  for (const tt of trendleTweets) {
    try {
      const likers = await getLikingUsers(tt.tweetId);
      for (const likerId of likers) {
        if (!creatorIdSet.has(likerId)) continue;
        const creator = creatorByTwitterId.get(likerId)!;
        await prisma.interaction.upsert({
          where: { creatorId_trendleTweetId_type: { creatorId: creator.id, trendleTweetId: tt.id, type: "like" } },
          update: {},
          create: { creatorId: creator.id, trendleTweetId: tt.id, type: "like" },
        });
        totalFound++;
      }
    } catch { /* skip */ }
  }

  // 3. COMMENTS
  const trendleId = process.env.TRENDLE_TWITTER_ID;
  if (trendleId) {
    for (const creator of creators) {
      try {
        const creatorTweets = await prisma.tweet.findMany({
          where: { creatorId: creator.id }, orderBy: { postedAt: "desc" },
        });
        for (const tweet of creatorTweets) {
          if (!tweet.text.toLowerCase().includes("@trendlefi")) continue;
          const tweetDate = new Date(tweet.postedAt).getTime();
          let bestMatch = trendleTweets[0];
          let bestDiff = Infinity;
          for (const tt of trendleTweets) {
            const diff = Math.abs(new Date(tt.postedAt).getTime() - tweetDate);
            if (diff < bestDiff) { bestDiff = diff; bestMatch = tt; }
          }
          if (bestMatch) {
            await prisma.interaction.upsert({
              where: { creatorId_trendleTweetId_type: { creatorId: creator.id, trendleTweetId: bestMatch.id, type: "comment" } },
              update: { interactionTweetId: tweet.tweetId },
              create: { creatorId: creator.id, trendleTweetId: bestMatch.id, type: "comment", interactionTweetId: tweet.tweetId },
            });
            totalFound++;
          }
        }
      } catch { /* skip */ }
    }
  }

  // Also search recent replies
  try {
    const replies = await searchRecentTweets("to:trendlefi");
    for (const reply of replies) {
      const creator = creatorByTwitterId.get(reply.author_id || "");
      if (!creator) continue;
      const replyDate = new Date(reply.created_at || Date.now()).getTime();
      let bestMatch = trendleTweets[0];
      let bestDiff = Infinity;
      for (const tt of trendleTweets) {
        const ttDate = new Date(tt.postedAt).getTime();
        if (ttDate > replyDate) continue;
        const diff = replyDate - ttDate;
        if (diff < bestDiff) { bestDiff = diff; bestMatch = tt; }
      }
      if (bestMatch) {
        await prisma.tweet.upsert({
          where: { tweetId: reply.id },
          update: { mentionsTrendle: true },
          create: {
            tweetId: reply.id, creatorId: creator.id, text: reply.text,
            postedAt: new Date(reply.created_at || Date.now()),
            impressions: reply.public_metrics?.impression_count || 0,
            likes: reply.public_metrics?.like_count || 0,
            retweets: reply.public_metrics?.retweet_count || 0,
            replies: reply.public_metrics?.reply_count || 0,
            mentionsTrendle: true,
          },
        });
        await prisma.interaction.upsert({
          where: { creatorId_trendleTweetId_type: { creatorId: creator.id, trendleTweetId: bestMatch.id, type: "comment" } },
          update: { interactionTweetId: reply.id },
          create: { creatorId: creator.id, trendleTweetId: bestMatch.id, type: "comment", interactionTweetId: reply.id },
        });
        totalFound++;
      }
    }
  } catch { /* skip */ }

  await log("interactions", "success", totalFound, `${totalFound} interactions found`);
}

async function syncDuneMetrics() {
  try {
    const { DuneClient } = await import("@duneanalytics/client-sdk");
    const duneKey = process.env.DUNE_API_KEY || "";
    const dune = new DuneClient(duneKey);
    const result = await dune.getLatestResult({ queryId: 6868863 });
    const rows = result.result?.rows || [];

    const metricsMap = new Map<string, Record<string, number>>();
    for (const row of rows) {
      const trader = (row.trader as string).toLowerCase();
      metricsMap.set(trader, {
        total_volume: Number(row.total_volume) || 0,
        total_trading_fees: Number(row.total_trading_fees) || 0,
        total_holding_fees: Number(row.total_holding_fees) || 0,
        total_imbalance_fees: Number(row.total_imbalance_fees) || 0,
        total_funding_fees_paid: Number(row.total_funding_fees_paid) || 0,
        total_trades: Number(row.total_trades) || 0,
      });
    }

    const referrals = await prisma.referral.findMany();
    let updated = 0;
    for (const referral of referrals) {
      const metrics = metricsMap.get(referral.walletAddress.toLowerCase());
      if (!metrics) continue;

      await prisma.referral.update({
        where: { id: referral.id },
        data: {
          tradingVolume: metrics.total_volume,
          tradingFees: metrics.total_trading_fees,
          holdingFees: metrics.total_holding_fees,
          imbalanceFees: metrics.total_imbalance_fees,
          fundingFees: metrics.total_funding_fees_paid,
          totalTrades: metrics.total_trades,
        },
      });
      updated++;
    }

    await log("dune_metrics", "success", updated, `${updated} referral wallets updated`);
  } catch (error) {
    await log("dune_metrics", "error", 0, error instanceof Error ? error.message : String(error));
  }
}

async function syncCreatorProfiles() {
  const creators = await prisma.creator.findMany();
  let updated = 0;

  for (const creator of creators) {
    try {
      const user = await twitterClient.v2.userByUsername(creator.username, {
        "user.fields": ["public_metrics", "profile_image_url", "name"],
      });
      if (!user.data) continue;

      await prisma.creator.update({
        where: { id: creator.id },
        data: {
          displayName: user.data.name,
          profileImage: user.data.profile_image_url || null,
          followerCount: user.data.public_metrics?.followers_count || creator.followerCount,
        },
      });
      updated++;
      console.log(`  Updated: ${creator.username} (${user.data.public_metrics?.followers_count} followers)`);
    } catch {
      // Skip on rate limit or error
    }
  }

  await log("creator_profiles", "success", updated, `${updated} profiles updated`);
}

// --- Run ---
async function main() {
  console.log("=== Trendle Creator Program — Full Sync ===");
  console.log("Tracking from:", TRACKING_START);
  console.log("Current time:", new Date().toISOString());
  console.log();

  console.log("Step 1/7: Syncing creator profiles...");
  await syncCreatorProfiles();

  console.log("Step 2/7: Syncing Trendle tweets...");
  await syncTrendleTweets();

  console.log("Step 3/7: Syncing creator timelines...");
  await syncCreatorTimelines();

  console.log("Step 4/7: Syncing Trendle mentions...");
  await syncTrendleMentions();

  console.log("Step 5/7: Refreshing metrics...");
  await refreshMetrics();

  console.log("Step 6/7: Detecting interactions...");
  await detectInteractions();

  console.log("Step 7/7: Syncing Dune Analytics metrics...");
  await syncDuneMetrics();

  console.log("\n=== Sync complete! ===");
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
