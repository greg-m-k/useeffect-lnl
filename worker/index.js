// The server every lesson calls. Each endpoint really waits before it answers, so the timings the
// browser measures are real network timings. Visitors choose the delays within clamps.
//
//   GET    /effects/api/search?q=&base=&jitter=&slowShort=1&delay=   search a list of words
//   GET    /effects/api/customer?id=&ms=                             one customer
//   GET    /effects/api/customer-orders?id=&ms=                      that customer's orders
//   POST   /effects/api/orders?form=<name>                           place an order (counted per visitor)
//   GET    /effects/api/orders                                       how many orders each form placed
//   DELETE /effects/api/orders                                       start counting again
//
// Orders are counted per visitor (the x-lnl-session header) in a Durable Object and deleted
// 20 minutes after the visitor's last order.
import { DurableObject } from "cloudflare:workers";

const MAX_MS = 3000;
const SESSION = /^[a-z0-9-]{8,64}$/;
const SWEEP_MS = 20 * 60 * 1000;

const WORDS = `act action actions activity adapter after alias animation api app array async await batch batching boundary
cache callback cancel cascade class cleanup client closure commit component compose concurrent consumer context controlled
custom data debounce defer deferred dependency derived dispatch dom effect effects error event events external fetch fiber
flush form forward fragment handler hook hooks hydrate hydration id identity immutable input interval key keys layout lazy
lifecycle lint list loader loading memo memoize mount mutation navigation node observer optimistic paint parent portal
prefetch prop props provider pure query race react reconcile reducer ref refs render rendering resize resource route router
scheduler scroll selector server setstate side signal socket state stale strict subscribe subscription suspense sync
throttle timeout timer transition tree uncontrolled unmount update usecallback usecontext useeffect uselayouteffect
usememo usereducer useref usestate value view virtual websocket window worker`.split(/\s+/);

const CUSTOMERS = {
  "cust-1": { id: "cust-1", name: "Ada Lovelace", plan: "Enterprise" },
  "cust-2": { id: "cust-2", name: "Grace Hopper", plan: "Team" },
  "cust-3": { id: "cust-3", name: "Edsger Dijkstra", plan: "Starter" },
};
const ORDERS_OF = {
  "cust-1": [{ id: "o-101", total: 1200 }, { id: "o-102", total: 340 }],
  "cust-2": [{ id: "o-201", total: 90 }],
  "cust-3": [{ id: "o-301", total: 15 }, { id: "o-302", total: 75 }, { id: "o-303", total: 410 }],
};

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const number = (v, fallback) => (v == null || v === "" || !Number.isFinite(Number(v)) ? fallback : Number(v));

// Parse the search query once, at the boundary.
export function parseSearch(url) {
  const q = url.searchParams;
  return {
    q: (q.get("q") ?? "").toLowerCase().slice(0, 40),
    base: clamp(number(q.get("base"), 50), 0, MAX_MS),
    jitter: clamp(number(q.get("jitter"), 0), 0, 1000),
    slowShort: q.get("slowShort") === "1",
    delay: q.has("delay") ? clamp(number(q.get("delay"), 0), 0, MAX_MS) : null,
  };
}

// How long the server waits. A fixed delay if one is given; otherwise the base plus a random,
// long-tailed extra (exponential, mean = jitter), plus extra for short queries when slowShort is
// on, because short queries match more rows. random is passed in so tests can pin it.
export function latency({ q, base, jitter, slowShort, delay }, random = Math.random) {
  if (delay != null) return delay;
  const tail = jitter > 0 ? -jitter * Math.log(1 - random()) : 0;
  const short = slowShort ? Math.max(0, 6 - q.length) * 60 : 0;
  return Math.round(clamp(base + tail + short, 0, MAX_MS));
}

export function search(q) {
  return q ? WORDS.filter((w) => w.startsWith(q)).slice(0, 8) : [];
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const json = (body, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/effects/api/search") {
      const s = parseSearch(url);
      const ms = latency(s);
      await wait(ms);
      return json({ q: s.q, results: search(s.q), waitedMs: ms });
    }
    if (path === "/effects/api/customer" || path === "/effects/api/customer-orders") {
      const id = url.searchParams.get("id") ?? "";
      if (!CUSTOMERS[id]) return json({ error: "no such customer" }, 404);
      await wait(clamp(number(url.searchParams.get("ms"), 300), 0, MAX_MS));
      return json(path.endsWith("orders") ? { customerId: id, orders: ORDERS_OF[id] } : CUSTOMERS[id]);
    }
    if (path === "/effects/api/orders") {
      const session = request.headers.get("x-lnl-session") ?? "";
      if (!SESSION.test(session)) return json({ error: "x-lnl-session header required" }, 400);
      const stub = env.ORDERS.get(env.ORDERS.idFromName(session));
      if (request.method === "POST") return json(await stub.place((url.searchParams.get("form") ?? "form").slice(0, 40)));
      if (request.method === "DELETE") return json(await stub.reset());
      return json(await stub.counts());
    }
    return json({ error: "not found" }, 404);
  },
};

// One per visitor: how many orders each form placed.
export class Orders extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS orders (form TEXT NOT NULL, at INTEGER NOT NULL)");
  }
  async place(form) {
    this.ctx.storage.sql.exec("INSERT INTO orders (form, at) VALUES (?, ?)", form, Date.now());
    await this.ctx.storage.setAlarm(Date.now() + SWEEP_MS);
    return this.counts();
  }
  counts() {
    const rows = this.ctx.storage.sql.exec("SELECT form, COUNT(*) AS n FROM orders GROUP BY form").toArray();
    return Object.fromEntries(rows.map((r) => [r.form, r.n]));
  }
  reset() {
    this.ctx.storage.sql.exec("DELETE FROM orders");
    return {};
  }
  async alarm() {
    await this.ctx.storage.deleteAll();
  }
}
