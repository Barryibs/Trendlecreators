import { NextRequest, NextResponse } from "next/server";
import puppeteer, { type Browser, type Page } from "puppeteer";
import path from "path";
import { writeFileSync, mkdirSync } from "fs";

export const maxDuration = 120;

let browserInstance: Browser | null = null;
let landingPage: Page | null = null;

async function getLandingPage() {
  // Reuse browser
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath:
        process.env.CHROME_PATH ||
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
      ],
    });
    landingPage = null;
  }

  // Reuse or refresh landing page
  if (!landingPage || landingPage.isClosed()) {
    landingPage = await browserInstance.newPage();
    await landingPage.setViewport({
      width: 1280,
      height: 900,
      deviceScaleFactor: 2,
    });
    await landingPage.evaluateOnNewDocument(() => {
      localStorage.setItem("onboarding", "true");
    });
    await landingPage.goto("https://trendle.fi/", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    await new Promise((r) => setTimeout(r, 3000));
  } else {
    // Refresh for latest prices
    await landingPage.reload({ waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 3000));
  }

  return landingPage;
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const page = await getLandingPage();

    // Find the card for this slug
    const card = await page.evaluate((targetSlug: string) => {
      const links = document.querySelectorAll(`a[href="/${targetSlug}"]`);
      for (const link of links) {
        const rect = link.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 50) {
          return {
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        }
      }
      return null;
    }, slug);

    if (!card) {
      return NextResponse.json(
        { error: `Market "${slug}" not found on trendle.fi` },
        { status: 404 }
      );
    }

    const screenshot = await page.screenshot({
      type: "png",
      clip: {
        x: card.left,
        y: card.top,
        width: card.width,
        height: card.height,
      },
    });

    // Also save to public/screenshots/ for caching
    const outDir = path.join(process.cwd(), "public", "screenshots");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(path.join(outDir, `${slug}.png`), screenshot);

    return new NextResponse(Buffer.from(screenshot), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Capture error:", err);
    // Reset state on error
    landingPage = null;
    return NextResponse.json(
      { error: "Failed to capture market card" },
      { status: 500 }
    );
  }
}
