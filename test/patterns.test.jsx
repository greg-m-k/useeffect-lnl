// Each lesson's claim, proved against the real pattern components with React Testing Library.
import { test, expect, vi, afterEach } from "vitest";
import { render, screen, act, fireEvent, cleanup } from "@testing-library/react";
import { createElement as h, useState } from "react";
import * as RaceNoCleanup from "../app/effects/patterns/race-no-cleanup.jsx";
import * as RaceCleanup from "../app/effects/patterns/race-cleanup.jsx";
import * as ResetInEffect from "../app/effects/patterns/reset-in-effect.jsx";
import * as ResetWithKey from "../app/effects/patterns/reset-with-key.jsx";
import * as SubmitInEffect from "../app/effects/patterns/submit-in-effect.jsx";
import * as SubmitInHandler from "../app/effects/patterns/submit-in-handler.jsx";
import * as WaterfallEffects from "../app/effects/patterns/waterfall-effects.jsx";
import * as FetchTogether from "../app/effects/patterns/fetch-together.jsx";

afterEach(cleanup);

// 1. The race: the older response lands last.
async function raceOnce(Results) {
  const pending = {};
  const fetchResults = vi.fn((q) => new Promise((resolve) => { pending[q] = resolve; }));
  const { rerender } = render(h(Results, { query: "a", fetchResults }));
  rerender(h(Results, { query: "ab", fetchResults }));
  await act(() => pending.ab({ q: "ab", results: ["ab"] }));
  await act(() => pending.a({ q: "a", results: ["a"] }));
  return screen.getByTestId("results-for").textContent;
}

test("race: without cleanup the older answer wins and the page shows results for 'a'", async () => {
  expect(await raceOnce(RaceNoCleanup.Results)).toBe("a");
});

test("race: with cleanup the page shows results for the latest query", async () => {
  expect(await raceOnce(RaceCleanup.Results)).toBe("ab");
});

// 2. Resetting state when a prop changes.
function switchUsers(ProfileEditor) {
  const commits = [];
  const ada = { id: "u1", name: "Ada" };
  const grace = { id: "u2", name: "Grace" };
  const { rerender } = render(h(ProfileEditor, { user: ada, onCommit: (c) => commits.push(c) }));
  commits.length = 0;
  act(() => rerender(h(ProfileEditor, { user: grace, onCommit: (c) => commits.push(c) })));
  return commits;
}

test("reset: in an effect, the first commit after switching shows the previous user's draft", () => {
  const commits = switchUsers(ResetInEffect.ProfileEditor);
  expect(commits.map((c) => c.stale)).toEqual([true, false]);
});

test("reset: with a key, every commit shows the right user's draft", () => {
  const commits = switchUsers(ResetWithKey.ProfileEditor);
  expect(commits.map((c) => c.stale)).toEqual([false]);
});

// 3. Event logic in an effect: leave the form and come back.
function Host({ Form, postOrder }) {
  const [submitted, setSubmitted] = useState(false);  // kept above the form, as a router or store would
  const [open, setOpen] = useState(true);
  return h("div", {},
    h("button", { onClick: () => setOpen(!open) }, "toggle"),
    open && h(Form, { submitted, setSubmitted, postOrder }));
}
function submitThenReturn(Form) {
  const postOrder = vi.fn(() => Promise.resolve());
  render(h(Host, { Form, postOrder }));
  fireEvent.click(screen.getByText("Place order"));
  fireEvent.click(screen.getByText("toggle"));  // navigate away
  fireEvent.click(screen.getByText("toggle"));  // and back
  return postOrder.mock.calls.length;
}

test("submit: in an effect, coming back to the form places the order again", () => {
  expect(submitThenReturn(SubmitInEffect.CheckoutForm)).toBe(2);
});

test("submit: in the click handler, the order is placed once", () => {
  expect(submitThenReturn(SubmitInHandler.CheckoutForm)).toBe(1);
});

// 4. Effect-chained fetches.
async function fetchOrder(CustomerPage) {
  const started = [];
  const pending = {};
  const api = (name) => () => new Promise((resolve) => { started.push(name); pending[name] = resolve; });
  render(h(CustomerPage, { id: "cust-1", getCustomer: api("customer"), getOrders: api("orders") }));
  const before = [...started];
  await act(() => pending.customer({ id: "cust-1", name: "Ada" }));
  await act(async () => pending.orders?.({ orders: [] }));
  return { before, after: started };
}

test("waterfall: the child's fetch starts only after the parent's answer arrives", async () => {
  const { before, after } = await fetchOrder(WaterfallEffects.CustomerPage);
  expect(before).toEqual(["customer"]);
  expect(after).toEqual(["customer", "orders"]);
});

test("together: both fetches start at once", async () => {
  const { before } = await fetchOrder(FetchTogether.CustomerPage);
  expect(before).toEqual(["customer", "orders"]);
});
