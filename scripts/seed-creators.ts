import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const adapter = new PrismaBetterSqlite3({
  url: path.join(process.cwd(), "dev.db"),
});
const prisma = new PrismaClient({ adapter });

const creators = [
  { twitterId: "1705329284745764864", username: "0x_kaize", displayName: "kaize", profileImage: "https://pbs.twimg.com/profile_images/2033423443966992384/7oc3EqK-_normal.jpg", followerCount: 12242 },
  { twitterId: "1245118294115352576", username: "emmyb0y", displayName: "emmyboy.sol", profileImage: "https://pbs.twimg.com/profile_images/2009982711960649728/DxRpm-cY_normal.jpg", followerCount: 6369 },
  { twitterId: "1650027810122072065", username: "netrovertHQ", displayName: "Netrovert", profileImage: "https://pbs.twimg.com/profile_images/2032151164259643392/Ws3Lqlqc_normal.jpg", followerCount: 16669 },
  { twitterId: "1584906300378517504", username: "0xSireal", displayName: "0xSireal", profileImage: "https://pbs.twimg.com/profile_images/1937242551997640705/w75Zi7Jy_normal.jpg", followerCount: 3325 },
  { twitterId: "1803863271268585472", username: "Krptonoob", displayName: "Anointed", profileImage: "https://pbs.twimg.com/profile_images/2017666602695577600/cdBztFCo_normal.jpg", followerCount: 6229 },
  { twitterId: "1743699179677913097", username: "marvellousdefi", displayName: "Marvellous | DeFi", profileImage: "https://pbs.twimg.com/profile_images/2017809194175324160/bI7VY74q_normal.jpg", followerCount: 9918 },
  { twitterId: "1494597242195484693", username: "PinnacleCrypt", displayName: "Pinnacle Crypt", profileImage: "https://pbs.twimg.com/profile_images/1954742881526095872/uz-tF4VX_normal.jpg", followerCount: 11208 },
  { twitterId: "1053467996042223617", username: "The_realThonyX", displayName: "ThonyX", profileImage: "https://pbs.twimg.com/profile_images/1711294052719595520/3KwXrD-a_normal.jpg", followerCount: 4310 },
  { twitterId: "816303479790727169", username: "marilyn100x", displayName: "marilyn100x.eth", profileImage: "https://pbs.twimg.com/profile_images/1878471231059775488/icnkeGZd_normal.jpg", followerCount: 10183 },
  { twitterId: "1707427636098580480", username: "vicsclarissa", displayName: "VicsClarissa", profileImage: "https://pbs.twimg.com/profile_images/2006829646189334528/OWuCWDPE_normal.jpg", followerCount: 6129 },
  { twitterId: "1706246745099747328", username: "monasex_1", displayName: "Monasex", profileImage: "https://pbs.twimg.com/profile_images/1996993399304359936/QaOFfj20_normal.jpg", followerCount: 3186 },
  { twitterId: "1767174047979225088", username: "cryptovcdegen", displayName: "cryptovcdegen", profileImage: "https://pbs.twimg.com/profile_images/1866726357511630848/Snj2dFn__normal.jpg", followerCount: 2684 },
  { twitterId: "1250437771174367235", username: "Baheet_", displayName: "Baheet", profileImage: "https://pbs.twimg.com/profile_images/1707027976276123648/K78g2kJK_normal.jpg", followerCount: 5441 },
];

async function main() {
  for (const c of creators) {
    await prisma.creator.upsert({
      where: { username: c.username },
      update: {
        followerCount: c.followerCount,
        profileImage: c.profileImage,
        displayName: c.displayName,
      },
      create: c,
    });
    console.log("Added:", c.username, `(${c.followerCount} followers)`);
  }

  const count = await prisma.creator.count();
  console.log(`\nTotal creators in DB: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
