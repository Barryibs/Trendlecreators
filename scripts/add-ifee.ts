import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const adapter = new PrismaBetterSqlite3({ url: path.join(process.cwd(), "dev.db") });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.creator.create({
    data: {
      twitterId: "1675532154778910720",
      username: "Ifee_lovee",
      displayName: "Ife_love",
      profileImage: "https://pbs.twimg.com/profile_images/1856221877842116610/NNpmvzQR_normal.jpg",
      followerCount: 3211,
    },
  });
  console.log("Added: Ifee_lovee (3,211 followers)");
  const count = await prisma.creator.count();
  console.log("Total creators in DB:", count);
}

main().catch(console.error).finally(() => process.exit(0));
