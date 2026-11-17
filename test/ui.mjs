// Drive every lesson in a real browser and check what a visitor sees.
// npm run dev, then: npm run ui   (BASE=https://your.domain npm run ui for production; CHANNEL=chrome for Chrome)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:8810";
const catalogue = JSON.parse(readFileSync(new URL("../app/public/effects/topics.json", import.meta.url), "utf8"));
const lessons = catalogue.topics.flatMap((t) => t.lessons);
let browser, page;
const errors = [];

before(async () => {
  browser = await chromium.launch({ channel: process.env.CHANNEL ?? "msedge" });
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(`${m.text()} at ${m.location().url}`));
});
after(() => browser?.close());

const statusMatches = (re, timeout = 20000) =>
  page.waitForFunction((src) => new RegExp(src).test(document.querySelector("#status").textContent), re.source, { timeout });

test("home: one card per lesson, credits the origin and the author", async () => {
  await page.goto(BASE);
  await page.waitForSelector(".card");
  assert.equal(await page.locator(".card").count(), lessons.length);
  assert.equal(await page.locator(`header a[href="${catalogue.origin.url}"]`).count(), 1);
  assert.equal(await page.textContent("footer"), "Made by Greg Kitchen.");
});

test("every lesson: chips for the topic with itself marked current, and the author in the footer", async () => {
  for (const l of lessons) {
    await page.goto(BASE + l.path);
    await page.waitForSelector(".chips");
    assert.equal(await page.textContent('.chips [aria-current="page"]'), l.chip ?? l.title, l.path);
    assert.equal(await page.textContent("main > footer"), "Made by Greg Kitchen.", l.path);
  }
});

test("race: when the first answer is slowest, only the effect without cleanup ends stale", async () => {
  await page.goto(`${BASE}/effects/race/`);
  await page.click("#slow-first");
  await statusMatches(/^Typed "us"/);
  assert.match(await page.textContent("#status"), /without cleanup "u" ✗ stale · with cleanup "us" ✓/);
  assert.match(await page.textContent("#no-cleanup-code"), /PATTERN: Fetch in an effect, without cleanup/);
});

test("reset: every switch commits the previous draft once in the effect version and never with a key", async () => {
  await page.goto(`${BASE}/effects/reset/`);
  for (const u of ["u2", "u3", "u1"]) await page.click(`#user-${u}`);
  await page.waitForTimeout(200);
  const count = async (id) => (await page.textContent(`#${id}-counts`)).match(/draft(\d+)/)[1];
  assert.equal(await count("effect"), "3");
  assert.equal(await count("key"), "0");
});

test("submit: leaving and coming back places a second order only from the effect", async () => {
  await page.goto(`${BASE}/effects/submit/`);
  await page.click("#restart");
  await statusMatches(/Counts cleared/);
  await page.click("#effect button.primary");
  await page.click("#handler button.primary");
  await page.waitForFunction(() => document.querySelector("#effect-count").textContent === "1" && document.querySelector("#handler-count").textContent === "1");
  await page.click("#effect-away");
  await page.click("#handler-away");
  await page.waitForFunction(() => document.querySelector("#effect-count").textContent === "2", null, { timeout: 10000 });
  await page.waitForTimeout(800);
  assert.equal(await page.textContent("#handler-count"), "1");
});

test("waterfall: fetching together finishes well before the chained effects", async () => {
  await page.goto(`${BASE}/effects/waterfall/`);
  await page.click("#run");
  await statusMatches(/Fetching together \d+ms/);
  const [chained, together] = (await page.textContent("#status")).match(/\d+(?=ms)/g).map(Number);
  assert.ok(chained >= 600 && together < chained - 200, `${chained} vs ${together}`);
});

test("odds: a short mobile run counts stale results, and cleanup has none", async () => {
  await page.goto(`${BASE}/effects/odds/`);
  await page.selectOption("#trials", "20");
  await page.click("#run");
  await statusMatches(/Done: 20 pairs/, 120000);
  assert.match(await page.textContent("#no-cleanup-rate"), /^\d+ of 20/);
  assert.match(await page.textContent("#cleanup-rate"), /^0 of 20/);
  assert.match(await page.textContent("#large-result"), /a day/);
});

test("verdict: further reading links the React docs and Martin Fowler on code smells and data fetching", async () => {
  await page.goto(`${BASE}/effects/verdict/`);
  const links = await page.locator("#further-reading a").evaluateAll((as) => as.map((a) => a.href));
  for (const url of ["https://react.dev/learn/you-might-not-need-an-effect", "https://martinfowler.com/bliki/CodeSmell.html", "https://martinfowler.com/articles/data-fetch-spa.html"])
    assert.ok(links.includes(url), url);
});

test("every page fits a phone screen without sideways scrolling", async () => {
  await page.setViewportSize({ width: 390, height: 800 });
  for (const path of ["/", ...lessons.map((l) => l.path)]) {
    await page.goto(BASE + path);
    await page.waitForLoadState("networkidle");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, path);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
});

test("pages use plain statements", async () => {
  for (const path of ["/", ...lessons.map((l) => l.path)]) {
    await page.goto(BASE + path);
    await page.waitForSelector("footer");
    assert.doesNotMatch(await page.textContent("main"), /\bNeither\b|, not (a|an|the) |is the lesson|bargain|holy war/, path);
  }
});

test("nothing logged an error", () => {
  assert.deepEqual(errors, []);
});
