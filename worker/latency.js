// The latency model, shared by the server and the lesson pages so both patterns in a lesson can
// be sent the same delays. Plumbing: no pattern under comparison lives here.
const MAX_MS = 3000;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

// A fixed delay if one is given; otherwise the base plus a random, long-tailed extra
// (exponential, mean = jitter), plus extra for short queries when slowShort is on, because short
// queries match more rows. random is passed in so tests can pin it.
export function latency({ q, base, jitter, slowShort, delay }, random = Math.random) {
  if (delay != null) return delay;
  const tail = jitter > 0 ? -jitter * Math.log(1 - random()) : 0;
  const short = slowShort ? Math.max(0, 6 - q.length) * 60 : 0;
  return Math.round(clamp(base + tail + short, 0, MAX_MS));
}
