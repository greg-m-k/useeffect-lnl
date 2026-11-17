// Lesson page: each form places real orders on the server, which counts them per visitor.
// `submitted` lives on this page, above the form, as a router or store would keep it.
import { createRoot } from "react-dom/client";
import { $, say, busy } from "../lib/ui.js";
import { lesson } from "../lib/site.js";
import { timed } from "../lib/api.js";
import * as InEffect from "../patterns/submit-in-effect.jsx";
import * as InHandler from "../patterns/submit-in-handler.jsx";
import effectSource from "../patterns/submit-in-effect.jsx?raw";
import handlerSource from "../patterns/submit-in-handler.jsx?raw";

lesson($("main"));
$("#effect-code").textContent = effectSource;
$("#handler-code").textContent = handlerSource;

const ORDERS = "/effects/api/orders";
async function refresh() {
  const { body } = await timed(ORDERS);
  for (const id of ["effect", "handler"]) $(`#${id}-count`).textContent = String(body[id] ?? 0);
}

const forms = {
  effect: { Form: InEffect.CheckoutForm, root: createRoot($("#effect")), submitted: false, open: true },
  handler: { Form: InHandler.CheckoutForm, root: createRoot($("#handler")), submitted: false, open: true },
};
// Stable per form, as a real API client would be, so the effect's dependency does not change.
const postOrders = Object.fromEntries(Object.keys(forms).map((id) => [id, async () => {
  await timed(`${ORDERS}?form=${id}`, performance.now(), { method: "POST" });
  await refresh();
  say($("#status"), "The server received an order", "ok");
}]));

function render(id) {
  const f = forms[id];
  const setSubmitted = (v) => { f.submitted = v; render(id); };
  f.root.render(f.open
    ? <f.Form submitted={f.submitted} setSubmitted={setSubmitted} postOrder={postOrders[id]} />
    : <p className="status">Somewhere else in the app. The form is unmounted.</p>);
  $(`#${id}-where`).textContent = f.open ? "On the checkout page" : "Away from the checkout page";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const id of Object.keys(forms)) {
  $(`#${id}-away`).onclick = busy($(`#${id}-away`), async () => {
    forms[id].open = false; render(id);
    await sleep(600);
    forms[id].open = true; render(id);
  });
  render(id);
}

$("#restart").onclick = busy($("#restart"), async () => {
  await timed(ORDERS, performance.now(), { method: "DELETE" });
  for (const [id, f] of Object.entries(forms)) { f.submitted = false; f.open = true; render(id); }
  await refresh();
  say($("#status"), "Counts cleared", "ok");
});
refresh();
