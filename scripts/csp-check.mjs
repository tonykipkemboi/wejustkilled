// Smoke test: serve site/ with the vercel.json headers, load every route in headless Chrome,
// and fail on any CSP violation, console error or page error. Then run XSS probes with a
// hostile kills.json and hostile URL hashes (with CSP bypassed, so escaping is tested on its own).
// Usage: node scripts/csp-check.mjs [--shots DIR]   Env: CHROME_PATH to pick a Chrome binary.
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { startServer } from "./serve.mjs";

const PORT = Number(process.env.PORT || 8781);
const BASE = `http://127.0.0.1:${PORT}/`;
const shotsArg = process.argv.indexOf("--shots");
const SHOTS = shotsArg > 0 ? process.argv[shotsArg + 1] : null;
const exe = process.env.CHROME_PATH || ["/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => existsSync(p));
const data = JSON.parse(readFileSync(new URL("../site/kills.json", import.meta.url), "utf8"));
const k0 = data.kills[0];

const ROUTES = [
  "#/",
  "#/cases",
  "#/board",
  "#/morgue",
  "#/wanted",
  "#/timeline",
  "#/report",
  "#/victim/notion",
  `#/killer/${k0.handle.toLowerCase()}`,
  `#/month/${k0.created_at.slice(0, 7)}`,
  `#/case/${k0.id}`,
  "#/cert/notion",
  "#/verdict/notion",
  "#/verdict/definitely-not-a-product",
  "#/check/notion",
  "#/check/definitely-not-a-product",
  "#/check/" + encodeURIComponent("Acme Rocket Skates"),
  "#/cases?q=killed",
];

const problems = [];
const server = await startServer(PORT);
const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });

const watch = (page, label) => {
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    // Third-party avatar hosts can be unreachable from CI; the app handles that with a fallback.
    if (/Failed to load resource/.test(t) && !/Content Security Policy/.test(t)) return;
    problems.push(`${label}: console error: ${t}`);
  });
  page.on("pageerror", (e) => problems.push(`${label}: page error: ${e.message}`));
};
const cspHook = () => {
  window.__csp = [];
  document.addEventListener("securitypolicyviolation", (e) =>
    window.__csp.push(`${e.violatedDirective} blocked ${e.blockedURI || "inline"} (${e.sourceFile}:${e.lineNumber})`),
  );
};

// 1. Every route under the real CSP, in both themes, at desktop and phone widths.
for (const [theme, width, height] of [
  ["dark", 1440, 900],
  ["light", 390, 844],
]) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: theme });
  await ctx.addInitScript(cspHook);
  const page = await ctx.newPage();
  watch(page, `csp ${theme} ${width}`);
  const res = await page.goto(BASE, { waitUntil: "networkidle" });
  if (!res.headers()["content-security-policy"]) problems.push("CSP header missing from local server");
  await page.waitForTimeout(1500);
  const t0 = await page.evaluate(() => document.documentElement.dataset.theme);
  if (t0 !== theme) problems.push(`${theme}: theme.js picked ${t0} for prefers-color-scheme ${theme}`);
  if (SHOTS) {
    mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: `${SHOTS}/csp-home-${theme}.png` });
  }
  for (const r of ROUTES) {
    await page.evaluate((h) => (location.hash = h), r);
    await page.waitForTimeout(r.startsWith("#/cert") || r.startsWith("#/victim") ? 1500 : 600);
    if (SHOTS && ["#/board", "#/cert/notion", "#/victim/notion"].includes(r))
      await page.screenshot({ path: `${SHOTS}/csp-${theme}-${r.replace(/\W+/g, "-").replace(/^-|-$/g, "")}.png` });
  }
  await page.evaluate(() => (location.hash = "#/"));
  await page.waitForTimeout(300);
  // the light cord is a real button: pulling it flips the theme and is remembered
  await page.focus("#lights");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  const cord = await page.evaluate(() => ({
    t: document.documentElement.dataset.theme,
    p: document.querySelector("#lights").getAttribute("aria-pressed"),
    s: localStorage.getItem("wjk-theme"),
  }));
  const want = theme === "dark" ? "light" : "dark";
  if (cord.t !== want || cord.s !== want || cord.p !== String(want === "light"))
    problems.push(`${theme}: light cord did not toggle the theme (${JSON.stringify(cord)})`);
  // inline styles from templates must have been applied through the CSSOM
  await page.evaluate(() => (location.hash = "#/cases"));
  await page.waitForTimeout(600);
  const rot = await page.evaluate(() => document.querySelector("#wall .card")?.style.getPropertyValue("--r"));
  if (!rot) problems.push("card --r custom property was not applied (data-sty hydration failed)");
  const csp = await page.evaluate(() => window.__csp);
  csp.forEach((v) => problems.push(`CSP violation: ${v}`));
  await ctx.close();
}

// 2. XSS probes: hostile data and hostile hashes, CSP bypassed so only escaping protects us.
const P = (n) => `<img src=x onerror="window.__pwned=${n}">`;
const evil = {
  meta: { generated_at: "2026-11-04", brand_victims: [P(1), "Notion"] },
  kills: [
    {
      ...k0,
      id: "1000000000000000001",
      name: P(2) + '"><svg onload="window.__pwned=3">',
      text: `we just killed ${P(4)} <script>window.__pwned=5</script> " onmouseover="window.__pwned=6 @evil https://t.co/abc"x`,
      victims: [P(7), "Notion", "__proto__", "constructor"],
      killer: P(8),
      image: "javascript:window.__pwned=9",
      avatar: "https://evil.example/a.png",
    },
    { ...k0, id: "1000000000000000002", url: "javascript:window.__pwned=10" },
    { ...k0, id: "1000000000000000003", handle: '"><img src=x onerror=window.__pwned=11>' },
    { ...k0, id: "1000000000000000004", created_at: `2025-01-01T00:00:00Z<img src=x onerror=window.__pwned=12>` },
    { ...k0, id: "<img src=x onerror=window.__pwned=13>" },
  ],
};
const HASHES = [
  "#/",
  "#/cases",
  "#/cases?q=" + encodeURIComponent(P(20)),
  "#/cases?q=amp",
  "#/verdict/" + encodeURIComponent(P(21)),
  "#/check/" + encodeURIComponent(P(23)),
  "#/check/" + encodeURIComponent('"><svg onload="window.__pwned=24">'),
  "#/check/" + encodeURIComponent("javascript:window.__pwned=25"),
  "#/check/notion",
  "#/check/" + encodeURIComponent(P(7)),
  "#/month/" + encodeURIComponent("<svg/onload=window.__pwned=22>"),
  "#/victim/__proto__",
  "#/cert/constructor",
  "#/killer/__proto__",
  "#/case/%E0%A4%A",
  "#/case/1000000000000000001",
  "#/victim/notion",
  "#/board",
  "#/morgue",
  "#/wanted",
  "#/timeline",
];
{
  const ctx = await browser.newContext({ bypassCSP: true, viewport: { width: 1280, height: 800 } });
  await ctx.route("**/kills.json", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(evil) }));
  const page = await ctx.newPage();
  page.on("pageerror", (e) => problems.push(`xss: page error: ${e.message}`));
  await page.goto(BASE, { waitUntil: "networkidle" });
  for (const h of HASHES) {
    await page.evaluate((x) => (location.hash = x), h);
    await page.waitForTimeout(400);
    await page.mouse.move(300, 300);
    const r = await page.evaluate(() => {
      const bad = [];
      if (window.__pwned) bad.push(`payload ran: __pwned=${window.__pwned}`);
      for (const el of document.querySelectorAll("*")) {
        for (const a of el.attributes) {
          if (/^on/i.test(a.name)) bad.push(`event handler attribute ${a.name} on <${el.tagName.toLowerCase()}>`);
          if ((a.name === "href" || a.name === "src") && /^\s*javascript:/i.test(a.value)) bad.push(`javascript: URL`);
        }
        if (el.tagName === "SCRIPT" && !/\/(app|data|theme)\.js$|\/_vercel\/insights\/script\.js$/.test(el.src))
          bad.push("unexpected <script>");
        if (
          el.tagName === "IMG" &&
          el.src &&
          !/^(https:\/\/(pbs|abs)\.twimg\.com\/|blob:|http:\/\/127\.0\.0\.1)/.test(el.src)
        )
          bad.push(`unexpected img src ${el.src}`);
      }
      // share menus: every target must be a plain https:// or sms: link
      for (const a of document.querySelectorAll(".share-m a")) {
        const u = new URL(a.href, location.href);
        if (u.protocol !== "https:" && u.protocol !== "sms:") bad.push(`share link with ${u.protocol}`);
      }
      return bad;
    });
    r.forEach((b) => problems.push(`xss ${h}: ${b}`));
  }
  await ctx.close();
}

await browser.close();
server.close();
if (problems.length) {
  console.error(`FAIL: ${problems.length} problem(s)\n` + [...new Set(problems)].join("\n"));
  process.exit(1);
}
console.log(`OK: ${ROUTES.length} routes clean under CSP; ${HASHES.length} XSS probes found nothing.`);
