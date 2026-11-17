// Lesson page: load the same customer page both ways, one after the other, and time each request.
import { createRoot } from "react-dom/client";
import { $, say, timeline, busy } from "../lib/ui.js";
import { lesson } from "../lib/site.js";
import { timed } from "../lib/api.js";
import * as Waterfall from "../patterns/waterfall-effects.jsx";
import * as Together from "../patterns/fetch-together.jsx";
import waterfallSource from "../patterns/waterfall-effects.jsx?raw";
import togetherSource from "../patterns/fetch-together.jsx?raw";

lesson($("main"));
$("#waterfall-code").textContent = waterfallSource;
$("#together-code").textContent = togetherSource;
for (const id of ["customer", "orders"]) $(`#ms-${id}`).oninput = (e) => { $(`#o-${id}`).value = `${e.target.value}ms`; };

const ways = [
  { id: "waterfall", label: "Effects in each component", Page: Waterfall.CustomerPage, color: "orange", root: createRoot($("#waterfall")) },
  { id: "together", label: "Fetching together", Page: Together.CustomerPage, color: "blue", root: createRoot($("#together")) },
];

// Mount one way of loading the page and resolve when both of its requests have finished.
function load(way, id) {
  return new Promise((done) => {
    const t0 = performance.now();
    const spans = [];
    const api = (name, path, ms) => async () => {
      const r = await timed(`/effects/api/${path}?id=${id}&ms=${ms}&from=${way.id}`, t0);
      spans.push({ name, start: r.start, end: r.end, color: way.color });
      if (spans.length === 2) setTimeout(() => done({ spans, total: Math.max(...spans.map((s) => s.end)) }), 0);
      return r.body;
    };
    const getCustomer = api("customer", "customer", $("#ms-customer").value);
    const getOrders = api("orders", "customer-orders", $("#ms-orders").value);
    way.root.render(<way.Page key={t0} id={id} getCustomer={getCustomer} getOrders={getOrders} />);
  });
}

$("#run").onclick = busy($("#run"), async () => {
  say($("#status"), "Loading…", "wait");
  const totals = [];
  for (const way of ways) {
    const { spans, total } = await load(way, $("#customer").value);
    timeline($(`#${way.id}-timeline`), spans.sort((a, b) => a.start - b.start));
    totals.push(`${way.label} ${Math.round(total)}ms`);
  }
  say($("#status"), totals.join(" · "), "ok");
});
