# Is useEffect a Code Smell? A Lunch & Learn

An interactive Lunch & Learn on `useEffect`. "useEffect is a code smell" overstates a narrower point: effects are the right
tool for syncing with something outside React, and a source of bugs when used as a general "when X changes, do Y". Each
lesson runs a misuse next to its fix, in real React against a real server, and measures the difference.

Live at https://lnl.greg.kitchen/effects/. The format comes from Sam Peterson's https://lnl.sam-peterson.com.

| Lesson | Claim | Measured |
|---|---|---|
| Start here | What effects are for, where the slogan comes from, the terms | |
| Typing faster than the server | Without cleanup, an older answer that lands last leaves the page on the wrong results | which query each panel shows; every request's timing |
| Switching users | Resetting state in an effect commits the previous user's draft once on every switch; a key never does | stale commits, and how many the browser paints |
| The order placed twice | Event logic in an effect runs again when the form remounts; in the handler it runs once | orders the server received |
| Fetch, render, fetch again | Effects in parent and child make a waterfall; fetching together does not | each request's start and end |
| How rare is the race? | The race depends on jitter and input speed, and adds up with scale | stale rate over many real keystroke pairs |
| So is it a code smell? | Maintainability, the AI argument, a scorecard, the verdict | |

## Run it on your laptop

You need Node 22 or newer, on Windows, macOS or Linux. Nothing else: no Cloudflare account.

```
npm install
npm test          # the pattern components and the server, in Node (vitest + Testing Library)
npm run dev       # http://localhost:8810
npm run ui        # in a second terminal: walks every lesson in Edge (CHANNEL=chrome for Chrome)
```

## Where things are

```
app/effects/patterns/      The eight components the lessons compare, one standalone file each. Lessons show them verbatim.
app/effects/<lesson>/      One page per lesson (index.html).
app/effects/lessons/       Each page's script: wires controls to the components and measures.
app/effects/lib/           Site frame, page helpers, styles, API calls (plumbing).
app/public/effects/        topics.json: the topic and its lessons, listed once.
worker/                    The server: search with controllable latency, customers and orders, an order counter per visitor.
test/patterns.test.jsx     Each lesson's claim proved against the components.
test/ui.mjs                Browser walkthrough of every page.
```

Everything is served below `/effects/`, so the topic can sit next to others on one Lunch & Learn site.

## Deploy

The site and its API are one Cloudflare Worker (`lnl-effects`) with a Durable Object for the order counts.
`npx wrangler login`, then `npm run deploy`. With Cloudflare Workers Builds connected to this repository, use
`npm ci && npm test && npx vite build` as the build command and `npx wrangler deploy -c dist/lnl_effects/wrangler.json` as the deploy command.
`.github/workflows/ci.yml` runs the tests and the browser walkthrough on every push.

## How it was built

From the Lunch & Learn kit's rules in `AGENTS.md`: nothing mocked, every number measured, each pattern in its own file,
every term defined, and it runs locally from a fresh clone.
