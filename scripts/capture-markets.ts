import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

const MARKETS = [
  "bitcoin", "solana", "hyperliquid", "monad", "megaeth", "polymarket",
  "sonic", "kalshi", "artemis", "openclaw", "elon-musk", "donald-trump",
  "drake", "taylor-swift", "kanye-west", "cristiano-ronaldo", "bryan-johnson",
  "obama", "vladimir-putin", "volodymyr-zelenskyy", "zachxbt",
  "palm-beach-pete", "punch-kun", "gta-6", "pokemon", "harry-potter",
  "sydney-sweeney", "margot-robbie", "anthropic", "chatgpt", "mac-mini",
  "creatine", "kitkat", "looksmaxxing", "iran", "jeffrey-epstein",
];

const OUTPUT_DIR = path.join(process.cwd(), "public", "screenshots");

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const slugs = process.argv.length > 2
    ? process.argv.slice(2)
    : MARKETS;

  console.log(`Capturing ${slugs.length} market(s)...`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath:
      process.env.CHROME_PATH ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  for (const slug of slugs) {
    const outPath = path.join(OUTPUT_DIR, `${slug}.png`);
    console.log(`  Capturing ${slug}...`);

    const page = await browser.newPage();
    await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });

    await page.evaluateOnNewDocument(() => {
      localStorage.setItem("onboarding", "true");
    });

    try {
      await page.goto(`https://trendle.fi/${slug}`, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      // Wait for chart data to load
      await page
        .waitForFunction(
          () => {
            const paths = document.querySelectorAll("svg path[d]");
            for (const p of paths) {
              if ((p.getAttribute("d") || "").length > 100) return true;
            }
            return false;
          },
          { timeout: 30000 }
        )
        .catch(() => {});

      // Fix SVG gradients for headless Chrome
      await page.evaluate(() => {
        const svgs = document.querySelectorAll("svg");
        for (const svg of svgs) {
          const rect = svg.getBoundingClientRect();
          if (rect.width < 200 || rect.height < 100) continue;
          const paths = svg.querySelectorAll("path");
          for (const p of paths) {
            const fill = p.getAttribute("fill") || "";
            const d = p.getAttribute("d") || "";
            if (d.length < 100) continue;
            if (fill.includes("url(#")) {
              const isGreen = svg.innerHTML.includes("#22C55E");
              p.setAttribute(
                "fill",
                isGreen ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"
              );
            }
          }
        }
      });

      await new Promise((r) => setTimeout(r, 500));

      await page.screenshot({
        path: outPath,
        type: "png",
        clip: { x: 0, y: 0, width: 430, height: 520 },
      });

      console.log(`    ✓ Saved ${slug}.png`);
    } catch (err) {
      console.error(`    ✗ Failed: ${slug} -`, (err as Error).message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log("\nDone! Screenshots saved to public/screenshots/");
}

main().catch(console.error);
