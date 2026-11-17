// Lesson page: many real keystroke pairs, one at a time, counting stale endings for each component.
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { $, say, press, pressed, busy } from "../lib/ui.js";
import { lesson } from "../lib/site.js";
import { timed, searchUrl } from "../lib/api.js";
import { latency } from "../../../worker/latency.js";
import * as NoCleanup from "../patterns/race-no-cleanup.jsx";
import * as Cleanup from "../patterns/race-cleanup.jsx";

lesson($("main"));
$("#gap").oninput = (e) => { $("#o-gap").value = `${e.target.value}ms`; };
$("#slowShort").onclick = (e) => press(e.target, !pressed(e.target));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PATTERNS = { "no-cleanup": NoCleanup.Results, cleanup: Cleanup.Results };

// One pair: "u", a random pause, then "us", through an optional debounce. The pause is at least 30% of
// the average (people do not type two keys at once) plus a random, long-tailed rest.
// Both components get the same queries at the same moments, and the server gives both the same delays.
async function pair({ base, jitter, slowShort, gap, debounce }) {
  const delays = {};
  const delayFor = (q) => (delays[q] ??= latency({ q, base, jitter, slowShort }));
  let pending = 0;
  const views = Object.entries(PATTERNS).map(([id, Results]) => {
    const node = document.createElement("div");
    const root = createRoot(node);
    const fetchResults = async (q) => {
      pending += 1;
      try { return (await timed(searchUrl(q, delayFor(q), id))).body; } finally { pending -= 1; }
    };
    return { id, node, root, show: (q) => flushSync(() => root.render(<Results query={q} fetchResults={fetchResults} />)) };
  });
  const send = (q) => views.forEach((v) => v.show(q));

  const pause = 0.3 * gap - 0.7 * gap * Math.log(1 - Math.random());
  if (debounce === 0) {
    send("u");
    await sleep(pause);
    send("us");
  } else {
    // The query only changes once typing has been still for `debounce` ms.
    if (pause > debounce) { await sleep(debounce); send("u"); await sleep(pause - debounce); } else await sleep(pause);
    await sleep(debounce);
    send("us");
  }
  await sleep(0);
  while (pending > 0) await sleep(20);
  await sleep(0);
  const shown = Object.fromEntries(views.map((v) => [v.id, v.node.querySelector('[data-testid="results-for"]').textContent]));
  views.forEach((v) => v.root.unmount());
  return { stale: Object.fromEntries(Object.entries(shown).map(([id, q]) => [id, q !== "us"])) };
}

let rate = null;
function fmtRate(stale, n) {
  return `${stale} of ${n} (${((100 * stale) / n).toFixed(1)}%)`;
}
function scale() {
  for (const id of ["small", "large"]) {
    const n = Number($(`#${id}`).value);
    if (rate == null) { $(`#${id}-result`).textContent = "–"; continue; }
    $(`#${id}-result`).textContent = rate.stale > 0
      ? `≈ ${Math.round((n * rate.stale) / rate.n).toLocaleString()} stale results a day`
      // Rule of three: with 0 seen in n tries, the true rate is below 3/n with 95% confidence.
      : `fewer than ${Math.ceil((n * 3) / rate.n).toLocaleString()} a day (none seen in ${rate.n})`;
  }
}
$("#small").oninput = scale;
$("#large").oninput = scale;

$("#run").onclick = busy($("#run"), async () => {
  const [base, jitter] = $("#profile").value.split(",").map(Number);
  const opts = { base, jitter, slowShort: pressed($("#slowShort")), gap: Number($("#gap").value), debounce: Number($("#debounce").value) };
  const n = Number($("#trials").value);
  const stale = { "no-cleanup": 0, cleanup: 0 };
  for (let i = 1; i <= n; i++) {
    const r = await pair(opts);
    for (const id of Object.keys(stale)) stale[id] += r.stale[id] ? 1 : 0;
    for (const id of Object.keys(stale)) $(`#${id}-rate`).textContent = fmtRate(stale[id], i);
    say($("#status"), `Pair ${i} of ${n}…`, "wait");
  }
  for (const id of Object.keys(stale)) {
    $(`#${id}-detail`).textContent = stale[id] === 0
      ? `None seen. With 0 in ${n}, the true rate is below ${(300 / n).toFixed(1)}% (95% confidence).`
      : `Measured on ${$("#profile").selectedOptions[0].textContent.split(":")[0].toLowerCase()} settings.`;
  }
  rate = { stale: stale["no-cleanup"], n };
  scale();
  say($("#status"), `Done: ${n} pairs`, "ok");
});
