// Lesson page: both search components get the same query and the same server delays.
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { $, say, press, pressed, timeline, busy } from "../lib/ui.js";
import { lesson } from "../lib/site.js";
import { timed, searchUrl } from "../lib/api.js";
import { latency } from "../../../worker/latency.js";
import * as NoCleanup from "../patterns/race-no-cleanup.jsx";
import * as Cleanup from "../patterns/race-cleanup.jsx";
import noCleanupSource from "../patterns/race-no-cleanup.jsx?raw";
import cleanupSource from "../patterns/race-cleanup.jsx?raw";

lesson($("main"));
$("#no-cleanup-code").textContent = noCleanupSource;
$("#cleanup-code").textContent = cleanupSource;
for (const id of ["base", "jitter", "gap"]) $(`#${id}`).oninput = (e) => { $(`#o-${id}`).value = `${e.target.value}ms`; };
$("#slowShort").onclick = (e) => press(e.target, !pressed(e.target));

// One run = one burst of typing. Each query gets one delay, sent to both patterns.
let run = { t0: performance.now(), delays: {}, spans: { "no-cleanup": [], cleanup: [] }, typed: "" };
function newRun() {
  run = { t0: performance.now(), delays: {}, spans: { "no-cleanup": [], cleanup: [] }, typed: "" };
}
function delayFor(q) {
  run.delays[q] ??= latency({ q, base: Number($("#base").value), jitter: Number($("#jitter").value), slowShort: pressed($("#slowShort")) });
  return run.delays[q];
}

// Each pattern gets its own fetch function, which records every request for its timeline.
function fetcher(id, color) {
  return async (q) => {
    const r = await timed(searchUrl(q, delayFor(q), id), run.t0);
    run.spans[id].push({ name: `"${q}"`, start: r.start, end: r.end, color });
    draw(id);
    return r.body;
  };
}
const fetchers = { "no-cleanup": fetcher("no-cleanup", "orange"), cleanup: fetcher("cleanup", "blue") };

function draw(id) {
  const spans = [...run.spans[id]].sort((a, b) => a.start - b.start);
  const lastArrived = run.spans[id].at(-1);
  timeline($(`#${id}-timeline`), spans.map((s) => ({ ...s, name: s === lastArrived ? `${s.name} answered last` : s.name })));
  setTimeout(verdict, 50);
}

const roots = { "no-cleanup": createRoot($("#no-cleanup")), cleanup: createRoot($("#cleanup")) };
function show(query) {
  run.typed = query;
  $("#query").value = query;
  flushSync(() => {
    roots["no-cleanup"].render(<NoCleanup.Results query={query} fetchResults={fetchers["no-cleanup"]} />);
    roots.cleanup.render(<Cleanup.Results query={query} fetchResults={fetchers.cleanup} />);
  });
}
show("");

// After every answer: which panel shows the query that was typed last?
function verdict() {
  const pending = run.typed && ["no-cleanup", "cleanup"].some((id) => run.spans[id].length < Object.keys(run.delays).length);
  if (!run.typed) return;
  const shows = (id) => $(`#${id} [data-testid="results-for"]`).textContent;
  const a = shows("no-cleanup"), b = shows("cleanup");
  const mark = (s) => (s === run.typed ? `"${s}" ✓` : `"${s}" ✗ stale`);
  say($("#status"), `${pending ? "Waiting for answers… " : ""}Typed "${run.typed}" · without cleanup ${mark(a)} · with cleanup ${mark(b)}`,
    pending ? "wait" : a === run.typed && b === run.typed ? "ok" : "err");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function type(text, gaps) {
  newRun();
  show("");
  for (let i = 1; i <= text.length; i++) {
    show(text.slice(0, i));
    if (i < text.length) await sleep(gaps(i));
  }
  while (["no-cleanup", "cleanup"].some((id) => run.spans[id].length < Object.keys(run.delays).length)) await sleep(50);
  verdict();
}

$("#type").onclick = busy($("#type"), () => type("useeffect", () => Number($("#gap").value)));
$("#slow-first").onclick = busy($("#slow-first"), async () => {
  newRun();
  show("");
  run.delays.u = 900;  // the first query's answer takes longest
  run.delays.us = 100;
  show("u");
  await sleep(150);
  show("us");
  while (["no-cleanup", "cleanup"].some((id) => run.spans[id].length < 2)) await sleep(50);
  verdict();
});
$("#query").oninput = (e) => {
  if (!e.target.value) newRun();
  show(e.target.value.toLowerCase());
};
