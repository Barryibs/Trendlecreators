import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const adapter = new PrismaBetterSqlite3({ url: path.join(process.cwd(), "dev.db") });
const prisma = new PrismaClient({ adapter });

const wallets: Record<string, string> = {
  "emmyb0y": "0x33cE33e8b2C897f79B773F7e45Af84017e1D1eEa",
  "netrovertHQ": "0x8d52762c9e93D29Ecf7424B6dA520bA3Acf52057",
  "0xSireal": "0x04618A23611D945e8E3D8Ba9CdbCc041af0E9DBe",
  "Krptonoob": "0x0D98c81dA10167187dEbA8f38BaD2d28318c110A",
  "PinnacleCrypt": "0xc13d7c74725efD49E92B5816146156186fEFA134",
  "The_realThonyX": "0xfe94D93fBba8B897B593950E40dDa83BF32D3B7B",
  "marilyn100x": "0xa28989B5EfF508d27B1De8CF40f64924044C8b0B",
  "vicsclarissa": "0xA95a7367E17Fd235768Bb5f7ad2721c31cBf7FB7",
  "cryptovcdegen": "0xB576c60f2dCEE8B7Fa9f43C7eC6135BEe9a8E564",
};

async function main() {
  for (const [username, wallet] of Object.entries(wallets)) {
    await prisma.creator.update({
      where: { username },
      data: { walletAddress: wallet },
    });
    console.log(`Set wallet for @${username}: ${wallet}`);
  }

  // Show all creators and their wallet status
  const all = await prisma.creator.findMany({ orderBy: { username: "asc" } });
  console.log("\nAll creators:");
  for (const c of all) {
    console.log(`  @${c.username}: ${c.walletAddress || "(no wallet)"}`);
  }
}

main().catch(console.error).finally(() => process.exit(0));
