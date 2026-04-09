import { NextRequest, NextResponse } from "next/server";
import puppeteer, { type Browser } from "puppeteer";

export const maxDuration = 60;

let browserInstance: Browser | null = null;

async function getBrowser() {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }
  browserInstance = await puppeteer.launch({
    headless: "new",
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
  return browserInstance;
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });

    // Skip onboarding modal
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem("onboarding", "true");
    });

    await page.goto(`https://trendle.fi/${slug}`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Wait for chart SVG path with actual data to render
    await page
      .waitForFunction(
        () => {
          const paths = document.querySelectorAll("svg path[d]");
          for (const p of paths) {
            const d = p.getAttribute("d") || "";
            if (d.length > 100) return true;
          }
          return false;
        },
        { timeout: 30000 }
      )
      .catch(() => {});

    // Extra wait for gradient fill to fully render
    await new Promise((r) => setTimeout(r, 2000));

    const screenshot = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: 430, height: 520 },
    });

    await page.close();

    return new NextResponse(Buffer.from(screenshot), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (err) {
    console.error("Screenshot error:", err);
    if (page) await page.close().catch(() => {});
    return NextResponse.json(
      { error: "Failed to capture screenshot" },
      { status: 500 }
    );
  }
}
