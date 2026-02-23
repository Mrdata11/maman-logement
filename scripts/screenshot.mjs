import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3001";
const output = process.argv[3] || "/tmp/screenshot.png";

const scrollY = parseInt(process.argv[4] || "0", 10);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
await page.goto(url, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(5000);
// Dismiss cookie banner if present
await page.click('button:has-text("Compris")').catch(() => {});
await page.waitForTimeout(300);
if (scrollY > 0) {
  await page.evaluate((y) => window.scrollBy(0, y), scrollY);
  await page.waitForTimeout(300);
}
await page.screenshot({ path: output, fullPage: false });
await browser.close();
console.log(`Screenshot saved: ${output}`);
