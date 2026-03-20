export interface CreatorWithMetrics {
  id: string;
  twitterId: string;
  username: string;
  displayName: string;
  profileImage: string | null;
  followerCount: number;
  addedAt: string;
  trendleMentions: number;
  totalImpressions: number;
  totalEngagement: number;
  interactionCount: number;
}

export interface TrendleTweetWithInteractions {
  id: string;
  tweetId: string;
  text: string;
  postedAt: string;
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
  interactions: {
    id: string;
    type: string;
    creator: {
      id: string;
      username: string;
      displayName: string;
      profileImage: string | null;
    };
    detectedAt: string;
  }[];
}

export interface DashboardStats {
  totalCreators: number;
  totalTrendleMentions: number;
  totalImpressions: number;
  totalEngagement: number;
  recentMentions: {
    id: string;
    tweetId: string;
    text: string;
    postedAt: string;
    impressions: number;
    likes: number;
    retweets: number;
    creator: {
      username: string;
      displayName: string;
      profileImage: string | null;
    };
  }[];
  topCreators: CreatorWithMetrics[];
  impressionsOverTime: { date: string; impressions: number }[];
  weeks: { start: string; end: string; label: string }[];
}
