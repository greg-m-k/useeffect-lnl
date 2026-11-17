// Calls to this topic's server, timed. Plumbing shared by the lesson pages.
const KEY = "lnl-effects-session";

// One id per browser tab, so the orders you place are counted for you alone.
export function session() {
  let id = null;
  try { id = sessionStorage.getItem(KEY); } catch { /* storage blocked: fall back to a per-page id */ }
  if (!id) {
    id = crypto.randomUUID();
    try { sessionStorage.setItem(KEY, id); } catch { /* keep the per-page id */ }
  }
  return id;
}

// fetch JSON and say when it started and finished, in ms since `t0`.
export async function timed(url, t0 = performance.now(), init = {}) {
  const start = performance.now() - t0;
  const response = await fetch(url, { ...init, headers: { "x-lnl-session": session(), ...(init.headers ?? {}) } });
  const body = await response.json();
  return { ok: response.ok, status: response.status, body, start, end: performance.now() - t0 };
}

// `from` keeps two panels' identical requests distinct, so the browser never makes one wait for the other.
export const searchUrl = (q, delay, from) => `/effects/api/search?q=${encodeURIComponent(q)}&delay=${delay}&from=${from}`;
