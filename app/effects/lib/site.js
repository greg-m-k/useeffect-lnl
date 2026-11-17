// Site frame: renders the home page and each lesson's chips, "Next" link and footer from topics.json.
// The footer only credits the author. Notes about what a visitor does (switches, data they create)
// belong on the lesson page where they do it.
// Topics and lessons are listed in one place, public/topics.json; nothing else repeats them.
import { el } from "./ui.js";

// Everything for this topic lives under /effects/, so it can sit next to other topics on one site.
const catalogue = () => fetch("/effects/topics.json").then((r) => r.json());
const slash = (p) => (p.endsWith("/") ? p : `${p}/`);

// The home page: header, then one section of cards per topic.
export async function home(main) {
  const site = await catalogue();
  main.replaceChildren(
    el("header", {}, el("h1", {}, site.title), el("p", { class: "lead" }, site.intro),
      el("p", { class: "lead" }, site.origin.text, " ", el("a", { href: site.origin.url }, new URL(site.origin.url).host), ".")),
    ...site.topics.map((t) => el("section", { class: "topic", "aria-labelledby": `topic-${t.slug}` },
      el("h2", { id: `topic-${t.slug}` }, el("span", { "aria-hidden": "true" }, t.emoji), ` ${t.title}`),
      el("p", {}, t.summary, " ", source(site, t)),
      el("ul", { class: "cards" }, ...t.lessons.map((l) =>
        el("li", {}, el("a", { class: "card", href: l.path }, el("h3", {}, l.title), el("p", {}, l.blurb))))))),
  );
  document.body.append(el("footer", { class: "site" }, ...credit(site)));
}

// A lesson page: chips for every lesson in its topic on top, "Next" and the footer at the bottom.
export async function lesson(main) {
  const site = await catalogue();
  const here = slash(location.pathname);
  const topic = site.topics.find((t) => t.lessons.some((l) => l.path === here));
  if (!topic) throw new Error(`${here} is not listed in topics.json`);
  const nav = el("nav", { class: "chips", "aria-label": `${topic.title} lessons` }, el("a", { href: "/" }, "← Home"),
    ...topic.lessons.map((l) => el("a", { href: l.path, "aria-current": l.path === here ? "page" : null }, l.chip ?? l.title)));
  main.prepend(nav);
  const current = nav.querySelector('[aria-current="page"]');
  nav.scrollLeft = current.offsetLeft - nav.offsetLeft - 18;  // on a phone, open scrolled to this lesson
  const next = topic.lessons[topic.lessons.findIndex((l) => l.path === here) + 1];
  if (next) main.append(el("p", { class: "next" }, "Next: ", el("a", { href: next.path }, `${next.title} →`)));
  main.append(el("footer", {}, ...credit(site)));
}

const credit = (site) => ["Made by ", el("a", { href: site.author.url }, site.author.name), "."];

// "The source for this topic": a link when topics.json names the repository, else the folder.
function source(site, topic) {
  return site.repo
    ? el("span", {}, el("a", { href: `${site.repo}/tree/main/${topic.source}` }, "The source for this topic is on GitHub"), ".")
    : el("span", {}, "The source for this topic is in ", el("code", {}, topic.source), ".");
}
