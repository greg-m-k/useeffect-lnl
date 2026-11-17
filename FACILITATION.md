# Running "Is useEffect a Code Smell?" live

About 45 minutes. The running site is the deck. Open it on the projector at `/effects/start/`, or run it locally with
`npm run dev` if the venue network is unreliable.

## Before the session

Press each lesson's main button once, so the Worker is warm. On the submit lesson press "Start again".

## Opening (5 min)

Ask the room: "Is useEffect a code smell?" Show of hands: yes, no, it depends. Then: "Do effect bugs only matter under heavy
load?" Write both splits down; you come back to them at the end.

## Start here (5 min)

Read the short answer aloud. Ask someone to explain the difference between a commit and a paint before you scroll to the terms.

## Typing faster than the server (7 min)

1. Predict: "If the first request is the slowest, which panel ends on the wrong results?" Press "Make the first answer slowest".
2. Jitter 150ms: press "Type it for me" three times. Then jitter 0 and once more. Ask why the bug vanished.
3. Land it: the race needs jitter larger than the gap between keystrokes. Load is not part of the condition.

## Switching users (5 min)

Predict: "How many commits show the wrong draft per switch?" Switch three times. Then turn on "Switch when data arrives" and switch
again. Ask why the painted count changed and whether it matters that the commit happened even when it was not painted.

## The order placed twice (5 min)

Place an order in both panels, then "Leave and come back" in both. Predict the server's counts first. Ask the room for the
analytics and payment versions of this bug in their own code.

## Fetch, render, fetch again (5 min)

Both delays at 300ms, then at 900ms. Predict totals. Ask how deep their own component trees fetch.

## How rare is the race? (8 min)

Run mobile, then office Wi-Fi, then wired, then mobile with a 300ms debounce. Before each run, ask for a prediction of the rate.
Then edit the two "interactions per day" fields to match apps people in the room work on.

## So is it a code smell? (5 min)

Walk the scorecard. Return to the opening show of hands: has anyone moved? Close with the working rule.

## When things misbehave

- First requests slow: cold Worker. Run again.
- Rates differ from last time: the network in the room adds its own jitter. Ask the room what that does to the odds.
- Submit counts look wrong: press "Start again". Counts are per browser tab.

## Make your own

The format comes from https://lnl.sam-peterson.com. Pick an argument your own team has and build the answers for real.
