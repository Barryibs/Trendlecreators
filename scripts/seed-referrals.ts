import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const adapter = new PrismaBetterSqlite3({ url: path.join(process.cwd(), "dev.db") });
const prisma = new PrismaClient({ adapter });

const referrals: Record<string, string[]> = {
  emmyb0y: [
    // Page 1
    "0x9d4f5082ae642e89574ceec91f3eb4d34f049906",
    "0xab7648a4f3934ee80a294574564e516c1590753a",
    "0xd98006bb905c1c276c902acf4c1a60b28db70054",
    "0x89da045296e4e0679b28f828b89452a55106356e",
    "0x86faf18978d9273bff1fc742b75d86bd5990f558",
    "0xcb0514e92a4fa45114d3ffd88084ad90f5c7d3a7",
    "0xdc73ff1056265e2c224e1ec5ac5e11f40336801c",
    "0xe67c04d123ea638bbbbae83917f8385651b5687c",
    "0xf71ca9be8805dc080865b8e12c8d3da850e066b8",
    "0x3091661f10dcbc665520c3546d45dc305f216a3f",
    // Page 2
    "0x782bcf8d1bf08ec34559b0eb1ebe8b7ceabedf80",
    "0x5718a271e0cea8e1526aff1ca4f8a07582fa5af4",
    "0xb15293d1f7a4bbfd7b8926283ef94521ad617dbe",
    "0x12e8fddbc83e7aa982b247e9e0d8b23476d2206d",
    "0x670ec7d137d8387d2a640f54f40c2c11d6cef98d",
    "0x411c2a535ba2564213b3116817c5ec76897f7df5",
    "0x7927cbffa6b7528ad192916be2d777803dea158f",
    "0xab433f78ebca1a2f84245884beac272ae0ed7cf7",
    "0xe4ef67d5ace16fe1df0b31745f2bc32352775f8d",
    "0x53e1cb0f4f8dac082fbca2897b9802b4881025f0",
    // Page 3
    "0xeff36ab53b5821d965d580845168bb71aad66ac4",
    "0x0007609aec311861d56bc12662c5bf490824c2cb",
    "0x77d112c8d75eb0f45b98097446cb76321f12f95a",
    "0x6eff502ac8d4b9061d0748b53adf60a9a25d4bee",
    "0x64758fa686baa2e435686b92e661cf90a8deae05",
    "0x3caddf75482933251126f9c88011c6d02204d6cf",
    "0x8ce9c30a28aaff62ce191d5c12543bad7e912621",
    "0x69a8f39441861a5870d20e4ad6a4e0fbe40fc425",
    "0x3cbab65a526ff6048e6c12f0f7adb97aaa3c5f79",
    "0xadf7e4e419b395643f3414fd84743133763caac6",
    // Page 4
    "0x4d49d9050e9c4a883e23852c28044cb849b8ea9f",
    "0x161580bba60fbde8f9303808dfcd7519e7086276",
    "0xa3f43f72a91b89c15d62c69d4db55bbe41c76c1a",
    "0xb2bdf921f6a4d59850dfdf9b32da93fddd1983e8",
    "0xfb4a352611ee5e792c5705c86c5cba51fd3b13b8",
    "0x8706664fa79c39678f5015481922efe3e5e847f3",
    "0xb2fa2a309b607ab8def2b97892ba5ca9d10385d9",
    "0xe834500d914f5c4e254b049aee1951d5be0a6c26",
    "0x4d6e172743585e3d2271b5b2d8c9910bf956330c",
    "0xb8f0fb48a6b9fdab70fb4602a66781bd2e56dad1",
    // Page 5
    "0x7f2d5c225c469b1a5a133a86d3cb82c3f639298e",
    "0x1756cf5421b86fecef49d97003c63db75f92fbc2",
    "0x7b23e17926587260499060bfe6ffb7fffc35dc5b",
    "0x2d80a4136e67a1ec29e1b44a6622844ee73b6883",
    "0x3c98fcfa7205a55b054f03072b56ecfde0956d5d",
    "0x4461af6e82ebda8c7b0fd2e0182d1d5f45ef153c",
    "0xa47c408c86897a530cf8f90ec7528beb9275d2fc",
    "0xfaef55d9e8f98da18530b2845d540a8d7935dd25",
    "0x5134111129bf3497d09d05e8869ee5da9e875c42",
    "0x1480222738d0372ad5872247a63a372389f994f3",
    // Page 6
    "0xef35533479e97d65f17caaee1170029c288e7f91",
    "0x50e932d1685f67dcd958a3ace454ad015513293b",
    "0xcc9490987b8afd8ae309207bc5730bc5e2b1c6d8",
    "0x5cae85fe59b55f3c29c96db99cc4bb919cb7aea5",
    "0xb61e4a9840e405dfee832186d13f26aebf385481",
    "0x110f96988610cfe2816fb7903266ec2692e20e7d",
    "0x9dd08295f1c92a97b3e1aa2e9aab25e1570ccf4c",
    "0xe8aac866f7adbff1d1561f022f3ec1fea3340168",
    "0xf6da66bb497379b88fe13ff25b7bbd4bb368d6ad",
    "0x81aeca08c44f708ae3205dd2ada6a92eadb10d0c",
    // Page 7
    "0x137b864ea0f57e16ca1c6eb7a76c08cf170f2a8d",
    "0xf7a92ed0551dad5f23fed8212db56bd024a7dfb1",
    "0x6b1296c70bae00cb4f49a7aa579e16e110fc3846",
    "0xf3fbc83c7f954fa31a1a78a2bfb0dce83e9daf91",
    "0xe2312dc8ff3459d09e750b6cdb54fe1e3ec4c42b",
    "0xadc4c00260544471fa58f41a639b8b59557902f6",
    "0xd3ed235fa378a20e2dcbe18b71025667c29de25e",
    "0x4a6e551344b3cc5156adf53985265af07027e0b3",
    "0xd6da3359f3755286b8e91858295e72cca9f7becc",
    "0xfbd72ed0a9408cb6f5a0986cd905d04e09d314dc",
    // Page 8 (+ The_realThonyX's 2 referrals and the last one)
    "0xaf8bfe9a1ccacbd77e4290eeae3f5ad1d549213e",
  ],
  The_realThonyX: [
    "0xc9b0a011c86fd62e3ac4c80016f0b0e932ff1a56",
    "0x28a4c55d79ba733f1398195a9a443be2f187ad02",
  ],
};

async function main() {
  for (const [username, wallets] of Object.entries(referrals)) {
    const creator = await prisma.creator.findUnique({ where: { username } });
    if (!creator) {
      console.log(`Creator @${username} not found, skipping`);
      continue;
    }

    let added = 0;
    for (const wallet of wallets) {
      await prisma.referral.upsert({
        where: {
          creatorId_walletAddress: {
            creatorId: creator.id,
            walletAddress: wallet.toLowerCase(),
          },
        },
        update: {},
        create: {
          creatorId: creator.id,
          walletAddress: wallet.toLowerCase(),
        },
      });
      added++;
    }
    console.log(`@${username}: ${added} referrals saved`);
  }

  const total = await prisma.referral.count();
  console.log(`\nTotal referrals in DB: ${total}`);
}

main().catch(console.error).finally(() => process.exit(0));
