import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { TwitterApi } from "twitter-api-v2";
import path from "path";

const adapter = new PrismaBetterSqlite3({
  url: path.join(process.cwd(), "dev.db"),
});
const prisma = new PrismaClient({ adapter });
const api = new TwitterApi(process.env.X_API_BEARER_TOKEN!);

async function main() {
  const trendleTweets = await prisma.trendleTweet.findMany({
    select: { tweetId: true },
  });
  const trendleIds = new Set(trendleTweets.map((t) => t.tweetId));
  console.log(`Trendle tweet IDs to match against: ${trendleIds.size}`);

  const creators = await prisma.creator.findMany();
  let quotesFound = 0;

  for (const creator of creators) {
    try {
      // Fetch timeline with referenced_tweets
      const timeline = await api.v2.userTimeline(creator.twitterId, {
        max_results: 100,
        start_time: "2025-03-01T00:00:00Z",
        "tweet.fields": [
          "referenced_tweets",
          "created_at",
          "public_metrics",
        ],
      });

      for (const tweet of timeline.data?.data || []) {
        const quotedRef = tweet.referenced_tweets?.find(
          (ref) => ref.type === "quoted"
        );
        if (!quotedRef || !trendleIds.has(quotedRef.id)) continue;

        // This is a quote tweet of a Trendle post!
        await prisma.tweet.upsert({
          where: { tweetId: tweet.id },
          update: {
            isQuoteTweet: true,
            quotedTweetId: quotedRef.id,
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
            quotes: tweet.public_metrics?.quote_count || 0,
            mentionsTrendle: true,
            isQuoteTweet: true,
            quotedTweetId: quotedRef.id,
          },
        });
        console.log(
          `  @${creator.username} quoted Trendle tweet ${quotedRef.id}`
        );
        quotesFound++;
      }
    } catch (err) {
      console.error(`Error for @${creator.username}:`, (err as Error).message);
    }
  }

  console.log(`\nTotal quote tweets found: ${quotesFound}`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
