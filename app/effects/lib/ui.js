// Small DOM helpers for lesson pages. Plumbing only: no pattern under comparison lives here.
const MIN_SCALE_MS = 200;

export const $ = (sel) => document.querySelector(sel);

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? "" : v);
  }
  node.append(...children.flat().filter((c) => c != null && c !== false));
  return node;
}

// A console pane: log(text, kind?) with kind "ok" | "err" | "wait".
export function logger(pre) {
  pre.textContent = "Nothing logged yet";
  let empty = true;
  return {
    log(text, kind) {
      if (empty) { pre.textContent = ""; empty = false; }
      pre.append(el("div", { class: kind }, `${new Date().toLocaleTimeString()}  ${text}`));
      pre.scrollTop = pre.scrollHeight;
    },
    clear() { pre.textContent = "Nothing logged yet"; empty = true; },
  };
}

// A status line: kind "ok" | "err" | "wait", or none.
export function say(node, text, kind = "") {
  node.textContent = text;
  node.className = `status ${kind}`.trim();
}

// On/off switch buttons: pressed(button) reads one; press(button, on) sets it and marks it with ✕.
export const pressed = (button) => button.getAttribute("aria-pressed") === "true";
export function press(button, on) {
  button.dataset.label ??= button.textContent;
  button.setAttribute("aria-pressed", String(on));
  button.textContent = `${button.dataset.label}${on ? " ✕" : ""}`;
}

// lanes: [{ name, start, end, color?, failed?, label? }] in ms from the start of the run;
// the scale fits the slowest lane.
export function timeline(container, lanes) {
  const scale = Math.ceil(Math.max(MIN_SCALE_MS, ...lanes.map((l) => l.end)) / 100) * 100;
  container.replaceChildren(
    ...lanes.map((l) => el("div", { class: "lane" },
      el("div", { class: "name", title: l.name }, l.name),
      el("div", { class: "track" }, el("div", {
        class: `seg${l.failed ? " fail" : ""}`, "data-color": l.color,
        style: `left:${(l.start / scale) * 100}%;width:${((l.end - l.start) / scale) * 100}%`,
        title: `${l.name}: ${Math.round(l.start)}–${Math.round(l.end)} ms`,
      })),
      el("div", { class: "ms" }, l.label ?? `${Math.round(l.end - l.start)}ms`))),
    el("div", { class: "axis" }, el("span"), el("div", { class: "ticks" },
      ...[0, 0.25, 0.5, 0.75, 1].map((f) => el("span", {}, `${Math.round(scale * f)}ms`))), el("span")),
  );
}

// Show a pattern's real source file in a <pre>, so the code on screen is the code that runs.
export async function showSource(pre, url) {
  pre.textContent = await (await fetch(url)).text();
}

// A click handler that disables its button while it runs.
export function busy(button, fn) {
  return async (...args) => {
    button.disabled = true;
    try { return await fn(...args); } finally { button.disabled = false; }
  };
}

// rows: [[label, value]] into a two-column table.
export function kvRows(table, rows) {
  table.replaceChildren(...rows.map(([k, v]) => el("tr", {}, el("th", {}, k), el("td", {}, String(v)))));
}
