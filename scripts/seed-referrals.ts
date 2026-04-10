import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql/web";
import path from "path";
import fs from "fs";

const url = process.env.TURSO_DATABASE_URL || "";
const authToken = process.env.TURSO_AUTH_TOKEN || "";
const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Read and parse the CSV
  const csvPath = path.join(__dirname, "referrals.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.trim().split("\n");
  const header = lines[0].split(",");
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    return {
      inviterAddress: values[0].toLowerCase(),
      invitedAddress: values[1].toLowerCase(),
      invitedRegisteredAt: values[2],
      volume: parseFloat(values[3]) || 0,
      tradesCount: parseInt(values[4]) || 0,
      fees: parseFloat(values[5]) || 0,
    };
  });

  // Load all creators with wallets and build a lookup by wallet address
  const creators = await prisma.creator.findMany();
  const creatorByWallet = new Map<string, (typeof creators)[0]>();
  for (const c of creators) {
    if (c.walletAddress) {
      creatorByWallet.set(c.walletAddress.toLowerCase(), c);
    }
  }

  console.log(`Loaded ${creators.length} creators, ${creatorByWallet.size} with wallets`);
  console.log(`CSV has ${rows.length} referral rows`);

  // First, clear existing referrals so we have a clean import from CSV
  const deleted = await prisma.referral.deleteMany();
  console.log(`Cleared ${deleted.count} existing referrals`);

  let matched = 0;
  let unmatched = 0;
  const unmatchedInviters = new Set<string>();

  for (const row of rows) {
    const creator = creatorByWallet.get(row.inviterAddress);
    if (!creator) {
      unmatched++;
      unmatchedInviters.add(row.inviterAddress);
      continue;
    }

    const registeredAt = new Date(row.invitedRegisteredAt);

    await prisma.referral.upsert({
      where: {
        creatorId_walletAddress: {
          creatorId: creator.id,
          walletAddress: row.invitedAddress,
        },
      },
      update: {
        tradingVolume: row.volume,
        tradingFees: row.fees,
        totalTrades: row.tradesCount,
        createdAt: registeredAt,
      },
      create: {
        creatorId: creator.id,
        walletAddress: row.invitedAddress,
        tradingVolume: row.volume,
        tradingFees: row.fees,
        totalTrades: row.tradesCount,
        createdAt: registeredAt,
      },
    });
    matched++;
  }

  console.log(`\nImported ${matched} referrals for tracked creators`);
  console.log(`Skipped ${unmatched} rows (inviter not a tracked creator)`);

  // Show per-creator breakdown
  const allReferrals = await prisma.referral.findMany({
    include: { creator: true },
  });
  const byCreator = new Map<string, { count: number; volume: number }>();
  for (const r of allReferrals) {
    const key = r.creator.username;
    const existing = byCreator.get(key) || { count: 0, volume: 0 };
    existing.count++;
    existing.volume += r.tradingVolume;
    byCreator.set(key, existing);
  }

  console.log("\nPer-creator referrals:");
  for (const [username, stats] of [...byCreator.entries()].sort((a, b) => b[1].volume - a[1].volume)) {
    console.log(`  @${username}: ${stats.count} referrals, $${stats.volume.toFixed(2)} volume`);
  }

  const total = await prisma.referral.count();
  console.log(`\nTotal referrals in DB: ${total}`);
}

main().catch(console.error).finally(() => process.exit(0));
