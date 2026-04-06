import { prisma } from "./db";
import {
  getUserTweets,
  searchRecentTweets,
  getRetweetedBy,
  getLikingUsers,
  lookupUser,
  TRACKING_START,
} from "./twitter";

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

async function log(
  syncType: string,
  status: string,
  tweetsRead: number,
  details?: string
) {
  await prisma.syncLog.create({
    data: { syncType, status, tweetsRead, details },
  });
}

export async function syncTrendleTweets() {
  const trendleId = process.env.TRENDLE_TWITTER_ID;
  if (!trendleId) {
    await log("trendle_tweets", "error", 0, "TRENDLE_TWITTER_ID not set");
    return;
  }

  try {
    const lastTweet = await prisma.trendleTweet.findFirst({
      orderBy: { postedAt: "desc" },
    });

    const tweets = await getUserTweets(
      trendleId,
      lastTweet?.tweetId || undefined,
      TRACKING_START,
      true // exclude replies — only main posts
    );

    let count = 0;
    for (const tweet of tweets) {
      // Double-check: skip if it's a reply
      const isReply = tweet.referenced_tweets?.some(
        (ref) => ref.type === "replied_to"
      );
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
          tweetId: tweet.id,
          text: tweet.text,
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
    await log(
      "trendle_tweets",
      "error",
      0,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function syncCreatorTimelines() {
  const creators = await prisma.creator.findMany();

  for (const creator of creators) {
    try {
      const lastTweet = await prisma.tweet.findFirst({
        where: { creatorId: creator.id },
        orderBy: { postedAt: "desc" },
      });

      const tweets = await getUserTweets(
        creator.twitterId,
        lastTweet?.tweetId || undefined,
        TRACKING_START
      );

      // Get all Trendle tweet IDs so we can detect quote tweets
      const trendleTweetIds = new Set(
        (await prisma.trendleTweet.findMany({ select: { tweetId: true } })).map(
          (t) => t.tweetId
        )
      );

      let count = 0;
      for (const tweet of tweets) {
        const isTrendle = mentionsTrendle(tweet.text);

        // Check if this is a quote tweet of a Trendle post
        const quotedRef = tweet.referenced_tweets?.find(
          (ref) => ref.type === "quoted"
        );
        const isQuoteTweet = quotedRef
          ? trendleTweetIds.has(quotedRef.id)
          : false;
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
            isQuoteTweet,
            quotedTweetId,
          },
          create: {
            tweetId: tweet.id,
            creatorId: creator.id,
            text: tweet.text,
            postedAt: new Date(tweet.created_at || Date.now()),
            impressions: tweet.public_metrics?.impression_count || 0,
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
            quotes: tweet.public_metrics?.quote_count || 0,
            mentionsTrendle: isTrendle || isQuoteTweet,
            isQuoteTweet,
            quotedTweetId,
          },
        });
        count++;
      }

      await log("creator_tweets", "success", count, creator.username);
    } catch (error) {
      await log(
        "creator_tweets",
        "error",
        0,
        `${creator.username}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

export async function syncTrendleMentions() {
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
          tweetId: tweet.id,
          creatorId: creator.id,
          text: tweet.text,
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
    await log(
      "search_mentions",
      "error",
      0,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function detectInteractions() {
  const creators = await prisma.creator.findMany();
  const creatorIdSet = new Set(creators.map((c) => c.twitterId));
  const creatorByTwitterId = new Map(creators.map((c) => [c.twitterId, c]));

  const trendleTweets = await prisma.trendleTweet.findMany({
    orderBy: { postedAt: "desc" },
  });

  const trendleTweetByTweetId = new Map(
    trendleTweets.map((t) => [t.tweetId, t])
  );

  let totalFound = 0;

  // 1. RETWEETS — check who retweeted each Trendle tweet
  for (const tt of trendleTweets) {
    try {
      const retweeters = await getRetweetedBy(tt.tweetId);
      for (const retweeterId of retweeters) {
        if (!creatorIdSet.has(retweeterId)) continue;
        const creator = creatorByTwitterId.get(retweeterId)!;
        await prisma.interaction.upsert({
          where: {
            creatorId_trendleTweetId_type: {
              creatorId: creator.id,
              trendleTweetId: tt.id,
              type: "retweet",
            },
          },
          update: {},
          create: {
            creatorId: creator.id,
            trendleTweetId: tt.id,
            type: "retweet",
          },
        });
        totalFound++;
      }
    } catch {
      // Skip on rate limit or error
    }
  }

  // 2. LIKES — check who liked each Trendle tweet
  for (const tt of trendleTweets) {
    try {
      const likers = await getLikingUsers(tt.tweetId);
      for (const likerId of likers) {
        if (!creatorIdSet.has(likerId)) continue;
        const creator = creatorByTwitterId.get(likerId)!;
        await prisma.interaction.upsert({
          where: {
            creatorId_trendleTweetId_type: {
              creatorId: creator.id,
              trendleTweetId: tt.id,
              type: "like",
            },
          },
          update: {},
          create: {
            creatorId: creator.id,
            trendleTweetId: tt.id,
            type: "like",
          },
        });
        totalFound++;
      }
    } catch {
      // Skip on rate limit or error
    }
  }

  // 3. COMMENTS — find creator tweets that are replies to Trendle tweets
  // Check all creator tweets for referenced_tweets pointing to a Trendle tweet
  const trendleId = process.env.TRENDLE_TWITTER_ID;
  if (trendleId) {
    for (const creator of creators) {
      try {
        // Get creator's full timeline (includes replies)
        const creatorTweets = await prisma.tweet.findMany({
          where: { creatorId: creator.id },
          orderBy: { postedAt: "desc" },
        });

        for (const tweet of creatorTweets) {
          // Check if this tweet is a reply to @trendlefi
          if (!tweet.text.toLowerCase().includes("@trendlefi")) continue;

          // Try to match to a specific Trendle tweet
          // Search for the Trendle tweet this is replying to by checking the API
          // For now, use the tweet text to find mentions of @trendlefi
          // and match to the closest Trendle tweet by time
          const tweetDate = new Date(tweet.postedAt).getTime();
          let bestMatch = trendleTweets[0];
          let bestDiff = Infinity;

          for (const tt of trendleTweets) {
            const diff = Math.abs(
              new Date(tt.postedAt).getTime() - tweetDate
            );
            if (diff < bestDiff) {
              bestDiff = diff;
              bestMatch = tt;
            }
          }

          if (bestMatch) {
            await prisma.interaction.upsert({
              where: {
                creatorId_trendleTweetId_type: {
                  creatorId: creator.id,
                  trendleTweetId: bestMatch.id,
                  type: "comment",
                },
              },
              update: { interactionTweetId: tweet.tweetId },
              create: {
                creatorId: creator.id,
                trendleTweetId: bestMatch.id,
                type: "comment",
                interactionTweetId: tweet.tweetId,
              },
            });
            totalFound++;
          }
        }
      } catch {
        // Skip on error
      }
    }
  }

  // Also search recent replies to @trendlefi from the search API
  try {
    const replies = await searchRecentTweets("to:trendlefi");
    for (const reply of replies) {
      const creator = creatorByTwitterId.get(reply.author_id || "");
      if (!creator) continue;

      // Find which Trendle tweet this is a reply to
      // The search API doesn't give us referenced_tweets easily,
      // so match by closest time
      const replyDate = new Date(reply.created_at || Date.now()).getTime();
      let bestMatch = trendleTweets[0];
      let bestDiff = Infinity;

      for (const tt of trendleTweets) {
        const ttDate = new Date(tt.postedAt).getTime();
        // Reply must be after the Trendle tweet
        if (ttDate > replyDate) continue;
        const diff = replyDate - ttDate;
        if (diff < bestDiff) {
          bestDiff = diff;
          bestMatch = tt;
        }
      }

      if (bestMatch) {
        // Also store the reply tweet in the Tweet table
        await prisma.tweet.upsert({
          where: { tweetId: reply.id },
          update: { mentionsTrendle: true },
          create: {
            tweetId: reply.id,
            creatorId: creator.id,
            text: reply.text,
            postedAt: new Date(reply.created_at || Date.now()),
            impressions: reply.public_metrics?.impression_count || 0,
            likes: reply.public_metrics?.like_count || 0,
            retweets: reply.public_metrics?.retweet_count || 0,
            replies: reply.public_metrics?.reply_count || 0,
            mentionsTrendle: true,
          },
        });

        await prisma.interaction.upsert({
          where: {
            creatorId_trendleTweetId_type: {
              creatorId: creator.id,
              trendleTweetId: bestMatch.id,
              type: "comment",
            },
          },
          update: { interactionTweetId: reply.id },
          create: {
            creatorId: creator.id,
            trendleTweetId: bestMatch.id,
            type: "comment",
            interactionTweetId: reply.id,
          },
        });
        totalFound++;
      }
    }
  } catch {
    // Skip search errors
  }

  await log("interactions", "success", totalFound, `${totalFound} interactions found`);
}

// Full re-scan: paginate through creator timelines to find ALL Trendle tweets and update metrics
export async function refreshMetrics() {
  const creators = await prisma.creator.findMany();

  const trendleTweetIds = new Set(
    (await prisma.trendleTweet.findMany({ select: { tweetId: true } })).map(
      (t) => t.tweetId
    )
  );

  let updated = 0;
  let newFound = 0;

  for (const creator of creators) {
    try {
      // Paginate up to 5 pages (500 tweets) to find all Trendle mentions
      const tweets = await getUserTweets(
        creator.twitterId,
        undefined,
        TRACKING_START,
        false,
        5 // 5 pages = up to 500 tweets
      );

      for (const tweet of tweets) {
        const isTrendle = mentionsTrendle(tweet.text);
        const quotedRef = tweet.referenced_tweets?.find(
          (ref) => ref.type === "quoted"
        );
        const isQuoteTweet = quotedRef
          ? trendleTweetIds.has(quotedRef.id)
          : false;

        // Also check if the tweet contains a trendle.fi URL
        const hasUrl = tweet.text.toLowerCase().includes("trendle.fi");

        if (!isTrendle && !isQuoteTweet && !hasUrl) continue;

        // Upsert — creates if new, updates if existing
        await prisma.tweet.upsert({
          where: { tweetId: tweet.id },
          update: {
            impressions: tweet.public_metrics?.impression_count || 0,
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
            quotes: tweet.public_metrics?.quote_count || 0,
            mentionsTrendle: true,
            isQuoteTweet,
            quotedTweetId: isQuoteTweet ? quotedRef!.id : undefined,
          },
          create: {
            tweetId: tweet.id,
            creatorId: creator.id,
            text: tweet.text,
            postedAt: new Date(tweet.created_at || Date.now()),
            impressions: tweet.public_metrics?.impression_count || 0,
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
            quotes: tweet.public_metrics?.quote_count || 0,
            mentionsTrendle: true,
            isQuoteTweet,
            quotedTweetId: isQuoteTweet ? quotedRef!.id : null,
          },
        });
        updated++;
      }
    } catch {
      // Skip on error
    }
  }

  // Also refresh Trendle tweet metrics with pagination
  const trendleId = process.env.TRENDLE_TWITTER_ID;
  if (trendleId) {
    try {
      const tweets = await getUserTweets(
        trendleId,
        undefined,
        TRACKING_START,
        true,
        5
      );

      for (const tweet of tweets) {
        const isReply = tweet.referenced_tweets?.some(
          (ref) => ref.type === "replied_to"
        );
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
            tweetId: tweet.id,
            text: tweet.text,
            postedAt: new Date(tweet.created_at || Date.now()),
            impressions: tweet.public_metrics?.impression_count || 0,
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
          },
        });
      }
    } catch {
      // Skip on error
    }
  }

  await log("refresh_metrics", "success", updated, `${updated} tweets updated/found`);
}

export async function syncDuneMetrics() {
  try {
    const { getAllTraderMetrics } = await import("./dune");
    const allMetrics = await getAllTraderMetrics();
    const referrals = await prisma.referral.findMany();

    let updated = 0;
    for (const referral of referrals) {
      const metrics = allMetrics.get(referral.walletAddress.toLowerCase());
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
    await log(
      "dune_metrics",
      "error",
      0,
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function syncCreatorProfiles() {
  const creators = await prisma.creator.findMany();
  let updated = 0;

  for (const creator of creators) {
    try {
      const user = await lookupUser(creator.username);
      if (!user) continue;

      await prisma.creator.update({
        where: { id: creator.id },
        data: {
          displayName: user.name,
          profileImage: user.profile_image_url || null,
          followerCount: user.public_metrics?.followers_count || creator.followerCount,
        },
      });
      updated++;
    } catch {
      // Skip on rate limit or error
    }
  }

  await log("creator_profiles", "success", updated, `${updated} profiles updated`);
}

export async function runFullSync() {
  await syncCreatorProfiles();
  await syncTrendleTweets();
  await syncCreatorTimelines();
  await syncTrendleMentions();
  await refreshMetrics();
  await detectInteractions();
  await syncDuneMetrics();
}
