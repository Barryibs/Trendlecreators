import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });

    // Skip onboarding modal
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem("onboarding", "true");
    });

    await page.goto(`https://trendle.fi/${slug}`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Wait for chart SVG to render
    await page.waitForSelector("svg", { timeout: 15000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 5000));

    // Capture just the top portion with chart (crop out bottom nav/tweets)
    const screenshot = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: 430, height: 520 },
    });

    await browser.close();

    return new NextResponse(Buffer.from(screenshot), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (err) {
    console.error("Screenshot error:", err);
    return NextResponse.json(
      { error: "Failed to capture screenshot" },
      { status: 500 }
    );
  }
}
