// Lesson page: switch users and count, for each editor, the commits that show another user's draft
// and how many of those the browser actually paints.
import { createRoot } from "react-dom/client";
import { $, el, say, press, pressed, kvRows } from "../lib/ui.js";
import { lesson } from "../lib/site.js";
import * as InEffect from "../patterns/reset-in-effect.jsx";
import * as WithKey from "../patterns/reset-with-key.jsx";
import effectSource from "../patterns/reset-in-effect.jsx?raw";
import keySource from "../patterns/reset-with-key.jsx?raw";

lesson($("main"));
$("#effect-code").textContent = effectSource;
$("#key-code").textContent = keySource;

const USERS = [{ id: "u1", name: "Ada" }, { id: "u2", name: "Grace" }, { id: "u3", name: "Edsger" }];
const panels = {
  effect: { Editor: InEffect.ProfileEditor, root: createRoot($("#effect")), log: [], staleCommits: 0, stalePaints: 0, switches: 0 },
  key: { Editor: WithKey.ProfileEditor, root: createRoot($("#key")), log: [], staleCommits: 0, stalePaints: 0, switches: 0 },
};
let current = USERS[0];

// Called by the editor after every commit. A stale commit is checked again just before the next
// paint: if the editor still shows the wrong draft then, the browser paints it.
function onCommit(id) {
  return (c) => {
    const p = panels[id];
    p.log.push(`${p.log.length + 1}. header ${name(c.user)} · draft of ${name(c.draftOwner)}${c.stale ? "  ✗ stale" : ""}`);
    if (c.stale) {
      p.staleCommits += 1;
      requestAnimationFrame(() => { if (p.latest?.stale) { p.stalePaints += 1; draw(id); } });
    }
    p.latest = c;
    draw(id);
  };
}
const name = (id) => USERS.find((u) => u.id === id)?.name ?? id;
const callbacks = { effect: onCommit("effect"), key: onCommit("key") };

function draw(id) {
  const p = panels[id];
  kvRows($(`#${id}-counts`), [["switches", p.switches], ["commits showing another user's draft", p.staleCommits],
    ["of those, painted on screen", p.stalePaints]]);
  $(`#${id}-log`).textContent = p.log.join("\n") || "Nothing yet";
}

function render() {
  for (const [id, p] of Object.entries(panels)) p.root.render(<p.Editor user={current} onCommit={callbacks[id]} />);
}

function select(user) {
  if (user.id === current.id) return;
  for (const p of Object.values(panels)) { p.log = []; p.switches += 1; }
  const go = () => { current = user; render(); };
  if (pressed($("#via-data"))) setTimeout(go, 0);  // as if the selection came back from a request
  else go();
  say($("#status"), `Switched to ${user.name}`, "ok");
}

$("#users").replaceChildren(el("span", { class: "status" }, "Select:"),
  ...USERS.map((u) => el("button", { id: `user-${u.id}`, onclick: () => select(u) }, u.name)));
$("#via-data").onclick = (e) => press(e.target, !pressed(e.target));
$("#clear").onclick = () => {
  for (const [id, p] of Object.entries(panels)) { Object.assign(p, { log: [], staleCommits: 0, stalePaints: 0, switches: 0 }); draw(id); }
};
render();
for (const p of Object.values(panels)) p.log = [];
draw("effect"); draw("key");
