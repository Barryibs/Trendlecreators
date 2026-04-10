import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

const OUTPUT_DIR = path.join(process.cwd(), "public", "screenshots");

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("Loading trendle.fi landing page...");

  const browser = await puppeteer.launch({
    headless: true,
    executablePath:
      process.env.CHROME_PATH ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("onboarding", "true");
  });

  await page.goto("https://trendle.fi/", {
    waitUntil: "networkidle2",
    timeout: 120000,
  });
  await new Promise((r) => setTimeout(r, 3000));

  // Find all market card links
  const cards = await page.evaluate(() => {
    const links = document.querySelectorAll("a[href]");
    const results: { slug: string; top: number; left: number; width: number; height: number }[] = [];
    for (const link of links) {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("/") || href === "/" || href.includes("leaderboard")) continue;
      const slug = href.replace("/", "");
      if (!slug || slug.includes("/")) continue;
      const rect = link.getBoundingClientRect();
      if (rect.width < 100 || rect.height < 50) continue;
      results.push({
        slug,
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    }
    return results;
  });

  console.log(`Found ${cards.length} market cards. Capturing...`);

  for (const card of cards) {
    const outPath = path.join(OUTPUT_DIR, `${card.slug}.png`);
    await page.screenshot({
      path: outPath,
      type: "png",
      clip: {
        x: card.left,
        y: card.top,
        width: card.width,
        height: card.height,
      },
    });
    console.log(`  ✓ ${card.slug}.png`);
  }

  await browser.close();
  console.log(`\nDone! ${cards.length} card screenshots saved to public/screenshots/`);
}

main().catch(console.error);
