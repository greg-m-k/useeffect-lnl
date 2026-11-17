// The server's pure parts: parsing at the boundary, the latency model and the search.
// (The Durable Object and real waits are exercised by the browser walkthrough in test/ui.mjs.)
import { test, expect } from "vitest";
import { parseSearch, latency, search } from "../worker/index.js";

const url = (qs) => new URL(`https://x/effects/api/search?${qs}`);

test("parses and clamps the search query", () => {
  expect(parseSearch(url("q=AB&base=99999&jitter=-4&slowShort=1"))).toEqual({ q: "ab", base: 3000, jitter: 0, slowShort: true, delay: null });
  expect(parseSearch(url("q=a&delay=900")).delay).toBe(900);
  expect(parseSearch(url("base=abc")).base).toBe(50);
});

test("a fixed delay wins; otherwise base plus a long tail plus extra for short queries", () => {
  expect(latency({ q: "a", base: 50, jitter: 100, slowShort: true, delay: 700 })).toBe(700);
  expect(latency({ q: "abc", base: 50, jitter: 0, slowShort: false, delay: null })).toBe(50);
  expect(latency({ q: "abc", base: 50, jitter: 0, slowShort: true, delay: null })).toBe(50 + 3 * 60);
  // random() = 1 - e^-1 gives a tail of exactly one mean
  expect(latency({ q: "abcdef", base: 0, jitter: 100, slowShort: true, delay: null }, () => 1 - Math.exp(-1))).toBe(100);
});

test("search finds words by prefix", () => {
  expect(search("usee")).toEqual(["useeffect"]);
  expect(search("")).toEqual([]);
  expect(search("zzz")).toEqual([]);
});
