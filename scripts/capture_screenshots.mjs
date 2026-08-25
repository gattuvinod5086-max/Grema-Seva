/**
 * Capture GramSeva UI screenshots for executive presentation.
 * Requires: dev server on http://localhost:5173 (npm run dev)
 * Run: npx playwright install chromium && node scripts/capture_screenshots.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../docs/presentation-screenshots");
const BASE = process.env.GRAMSEVA_URL || "http://localhost:5173";

const DEMO_USER = {
  id: "USR-SCREENSHOT",
  name: "R. Lakshmi",
  role: "Sarpanch",
  phone: "9876543210",
  district: "Yadadri Bhuvanagiri",
  mandal: "Yadagirigutta",
  village: "Yadagirigutta Town",
  ward: "4",
  registeredAt: new Date().toISOString(),
};

async function seedLocalStorage(page) {
  await page.evaluate(
    ({ user, keys }) => {
      const users = [user];
      localStorage.setItem("tg_grama_seva_users", JSON.stringify(users));
      localStorage.setItem("tg_grama_seva_session", user.phone);
      localStorage.removeItem("tg_grama_seva_demo_seeded");
    },
    { user: DEMO_USER, keys: {} }
  );
}

async function clickSidebar(page, label) {
  const btn = page.locator("button", { hasText: label }).first();
  await btn.waitFor({ state: "visible", timeout: 15000 });
  await btn.click();
  await page.waitForTimeout(800);
}

async function capture(page, name, opts = {}) {
  const file = path.join(OUT, `${name}.png`);
  if (opts.selector) {
    const el = page.locator(opts.selector).first();
    await el.waitFor({ state: "visible", timeout: 15000 });
    await el.screenshot({ path: file });
  } else if (opts.clip) {
    await page.screenshot({ path: file, clip: opts.clip });
  } else {
    await page.screenshot({ path: file, fullPage: false });
  }
  console.log("  ✓", name);
  return file;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 2 });

  // Mobile — citizen experience
  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(`${BASE}/app`, { waitUntil: "networkidle", timeout: 60000 });
  await seedLocalStorage(mobile);
  await mobile.reload({ waitUntil: "networkidle" });
  await mobile.waitForTimeout(1500);

  await capture(mobile, "01-home-mobile", { selector: "main" });
  await clickSidebar(mobile, "Report Issue");
  await capture(mobile, "02-report-mobile", { selector: "main" });
  await clickSidebar(mobile, "Village Logs");
  await capture(mobile, "03-issues-mobile", { selector: "main" });
  await clickSidebar(mobile, "Emergency & Help");
  await capture(mobile, "04-emergency-mobile", { selector: "main" });
  await clickSidebar(mobile, "AI Assistant");
  await capture(mobile, "05-vikas-mobile", { selector: "main" });

  // Desktop — official / analytics
  const desktop = await context.newPage();
  await desktop.setViewportSize({ width: 1440, height: 900 });
  await desktop.goto(`${BASE}/app`, { waitUntil: "networkidle", timeout: 60000 });
  await seedLocalStorage(desktop);
  await desktop.reload({ waitUntil: "networkidle" });
  await desktop.waitForTimeout(1500);

  await capture(desktop, "06-home-desktop", { selector: "main" });
  await clickSidebar(desktop, "Official Dashboard");
  await capture(desktop, "07-official-dashboard", { selector: "main" });
  await clickSidebar(desktop, "Village Analytics");
  await capture(desktop, "08-analytics", { selector: "main" });
  await clickSidebar(desktop, "Welfare Hub");
  await capture(desktop, "09-welfare", { selector: "main" });
  await clickSidebar(desktop, "News & Announcements");
  await capture(desktop, "10-news", { selector: "main" });

  // Login screen (logged out)
  const login = await context.newPage();
  await login.setViewportSize({ width: 1440, height: 900 });
  await login.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await login.evaluate(() => localStorage.clear());
  await login.reload({ waitUntil: "networkidle" });
  await login.waitForTimeout(1200);
  await capture(login, "11-login", { selector: "body" });

  // Standalone emergency page
  const emerg = await context.newPage();
  await emerg.setViewportSize({ width: 390, height: 844 });
  await emerg.goto(`${BASE}/emergency`, { waitUntil: "networkidle" });
  await emerg.waitForTimeout(1200);
  await capture(emerg, "12-emergency-standalone", { selector: "body" });

  await browser.close();
  console.log("\nScreenshots saved to:", OUT);
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err.message);
  console.error("Ensure dev server is running: npm run dev");
  process.exit(1);
});
