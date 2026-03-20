import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { lookupUser } from "@/lib/twitter";

export async function GET() {
  const creators = await prisma.creator.findMany({
    include: {
      tweets: { where: { mentionsTrendle: true } },
      interactions: true,
    },
    orderBy: { addedAt: "desc" },
  });

  const result = creators.map((c) => {
    const totalImpressions = c.tweets.reduce((s, t) => s + t.impressions, 0);
    const totalEngagement = c.tweets.reduce(
      (s, t) => s + t.likes + t.retweets + t.replies + t.quotes,
      0
    );
    return {
      id: c.id,
      twitterId: c.twitterId,
      username: c.username,
      displayName: c.displayName,
      profileImage: c.profileImage,
      followerCount: c.followerCount,
      addedAt: c.addedAt.toISOString(),
      trendleMentions: c.tweets.length,
      totalImpressions,
      totalEngagement,
      interactionCount: c.interactions.length,
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const clean = username.replace(/^@/, "").trim();

    // Check if already exists
    const existing = await prisma.creator.findUnique({
      where: { username: clean },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Creator already added" },
        { status: 409 }
      );
    }

    // Lookup on X
    const user = await lookupUser(clean);
    if (!user) {
      return NextResponse.json(
        { error: "User not found on X" },
        { status: 404 }
      );
    }

    const creator = await prisma.creator.create({
      data: {
        twitterId: user.id,
        username: user.username,
        displayName: user.name,
        profileImage: user.profile_image_url || null,
        followerCount: user.public_metrics?.followers_count || 0,
      },
    });

    return NextResponse.json(creator, { status: 201 });
  } catch (error) {
    console.error("Error adding creator:", error);
    return NextResponse.json(
      { error: "Failed to add creator" },
      { status: 500 }
    );
  }
}
