# AGENTS.md: building a Lunch & Learn

This repository is a kit for interactive Lunch & Learn sessions. Each **topic** takes one design question a
team keeps arguing about and builds every competing answer for real, side by side, so people learn by
running, slowing down, breaking and timing them. Read this file before changing anything. It is written for
coding agents and for the senior engineers who direct them.

## What a Lunch & Learn here is

- **One question, several patterns.** "Sequential vs Parallel Requests", "Federated Services vs Event-Driven
  Projections". Name the patterns by what they are. Never "Option A / Option B", never "the good way and the
  bad way". There can be two patterns or five.
- **Nothing is mocked.** Every request, queue, database and failure on screen really happens. A slider that
  adds latency makes a real service really wait. A switch that turns a service off makes it really refuse.
  If you cannot make something real, leave it out and say so on the page; do not fake it.
- **Measure, do not assert.** Every number on screen is measured while the visitor watches: timings from
  `performance.now()` or server timing headers, counts read from real storage. No hard-coded "about 300ms".
- **Learn by doing.** Each lesson gives the visitor a control (a button, slider or switch) and a prediction to
  make before pressing it. The page shows the outcome; the visitor draws the conclusion.
- **The code is the content.** Each pattern lives in its own standalone file, readable top to bottom, and the
  lesson shows that exact file (`showSource`). Duplicated plumbing between patterns is fine and expected.
  Never extract the pattern under comparison into a shared helper.
- **Runs locally from a fresh clone. Always.** Anyone who downloads the repository must be able to run every topic on
  their own laptop with `npm install` and `npm run dev`: no Cloudflare account, login, API token or remote resource.
  Use only what `wrangler dev` runs locally (Workers, static assets, D1, Queues, Durable Objects, service bindings).
  Never add something that only works deployed (Workers AI, Vectorize, Browser Rendering and the like) unless the topic
  also has a local path. Deploying is also required, but only so the topic has a live page on the LnL site; it is never
  the only way to run it.
- **Written for a senior engineer from another field.** Define every term the first time it appears, even ones
  that feel basic inside the domain ("domain", "projection", "idempotent", "waterfall"). Say what each pattern
  gets you and what it costs, in that order, for every pattern.

## Layout

This topic is a React topic, so unlike the plain kit it is a multi-page Vite app (`vite.config.js`) with the
Cloudflare Vite plugin running the Worker in development. The README's "Where things are" lists every folder. Pattern
components live in `app/effects/patterns/`, one file each, and lesson pages import them with `?raw` to show their source.
Everything is served below `/effects/`. Commands: `npm test`, `npm run dev` (port 8810), `npm run ui`, `npm run deploy`.

## Lesson anatomy

Every lesson page has the same shape, so a room can follow it on a projector:

1. **Chips** (drawn by `lesson()`): Home, then every lesson in the topic, current one filled.
2. **h1**: the lesson's question in plain words ("When a service goes down").
3. **Lead paragraph**: the situation, each pattern in one sentence with its name in its colour
   (`<strong data-color="blue">`), what to try, and "New to these terms? Start here".
4. **Control panel**: the run button, a status line, the sliders and switches, and one line suggesting what to
   try and asking for a prediction.
5. **One panel per pattern, side by side** (`.cols` > `.panel[data-color]`): a one-line description, the measured
   timeline, the code that ran, the answer, the console. Same order in every panel.
6. **Insight callout**: what the run showed and when the "losing" pattern is still the right choice.
7. **Next link and footer** (drawn by `lesson()`).

A **Start here** page (`class="prose"`) opens each topic: the problem, then for each pattern what it does, a small
diagram in a `<pre>`, what you get, what it costs, then a glossary (`<dl>`) of every term.

Each pattern keeps one colour across the whole topic: `blue`, `green`, `purple` or `orange`.

## Writing

Plain declarative sentences that say what happens. Write for a senior engineer reading carefully, not for a skimmer.

- No contrast framing: not "it's not X, it's Y", not "X, not Y", not "Neither A nor B is better". Say what each thing does.
- No slogans or punchlines ("the race is the lesson", "availability now, consistency eventually").
- No filler intensifiers (really, truly, simply, just) and no rhetorical questions in prose. A question to the room
  belongs in a control panel's "try this" line.
- One idea per sentence where you can. Define a term the first time, then use it the same way every time.
- The home page credits where the format comes from: `origin` in `public/topics.json` links lnl.sam-peterson.com,
  the original site of this kind. Keep it.
- The footer credits the author (`author` in `public/topics.json`). Notes about what a visitor does, such as how long
  data they create is kept or when switches turn off, go on the lesson page next to the control that does it.

## House style

- Plain and quiet, like a well-made reference page. The running patterns are the show.
- No coloured bars on top of cards or panels, no number badges, no gradients-as-decoration, no glow, no hero.
  A pattern's colour appears only in its name, its own panel and its timeline bars. Panels that are not one pattern's
  (controls, steps to take, shared results) stay neutral white, so a colour always means the same pattern.
- Paragraph text runs the full width of the column. Do not cap line length.
- Every page fits a 390px phone with no sideways scrolling; the chip row scrolls on its own.
- Light and dark mode both work, from the tokens in `styles.css`.

## How to work (the ub-mode way)

First make it work, then make it right.

- **Data shape first.** Write the topic's `TOPIC.md` claims table before any code: each lesson's claim, the control
  that demonstrates it, and what is measured. If a claim has no control that shows it, it is not a lesson.
- **TDD.** Write the failing test first, see it fail for the reason you expect, make the smallest change that passes.
  Server code gets unit tests in `test/`; each lesson's claim gets a step in `test/ui.mjs` that presses the control and
  checks the measured outcome (for example "parallel total < sequential total").
- **Test behaviour, not implementation.** A test that would still pass if every function returned nothing is worthless.
- **Check data where it enters.** Parse query strings and bodies once at the edge of `api.js` (see `parseWork`); trust
  them inside. Clamp anything a visitor controls (delays, counts) so a lesson cannot be used to hurt the service.
- **Make operations idempotent.** A visitor will double-click, refresh mid-run and open two tabs.
- **Isolate visitors.** Anything a visitor creates is theirs alone (a per-tab session id header) and is swept after a
  while. Switches a visitor turns on turn themselves off.
- **Subtract before you add.** Prefer one more lesson that shows one thing clearly over one lesson with five toggles.
- **Fix root causes.** A guard that hides a failure is not a fix.
- **Keep a log** of what you did and why, and report it when you finish.
- **Commit often**, small and ordered. Each message says why, what changed and how you proved it.
- **Deploying is outward-facing.** Never deploy, publish or push to a shared branch without the human's go-ahead.

If the ub tools are installed (crapper, dryer, mutator), run them on the topic you changed. Treat duplication *between*
patterns as intended; only de-duplicate inside one file.

## Adding a lesson

1. Add it to `app/public/effects/topics.json` with its claim in mind: one claim, one control, one measurement.
2. Write the two pattern components in `app/effects/patterns/` and a test in `test/patterns.test.jsx` that proves the claim. See it fail first.
3. Write `app/effects/<lesson>/index.html` and `app/effects/lessons/<lesson>.jsx` to the lesson anatomy above, and a step in `test/ui.mjs`.
4. `npm test`, `npm run dev`, `npm run ui`. All green before you push.

## Commands

```
npm install
npm test          vitest: pattern components and server
npm run dev       http://localhost:8810
npm run ui        browser walkthrough against BASE (default http://localhost:8810)
npm run deploy    vite build && wrangler deploy (ask first)
```

## Glossary of this kit

- **Topic**: one design question and its competing patterns, with a set of lessons.
- **Pattern**: one complete answer to the topic's question, built for real.
- **Lesson**: one page that demonstrates one claim about the patterns with one control.
- **Claim**: a statement a lesson proves by measurement, such as "parallel costs the slowest call, not the sum".
- **Control**: the button, slider or switch the visitor uses to test a claim.
- **Switch**: a control that breaks something for real (a service refuses, a broker stops). Switches turn themselves off.
