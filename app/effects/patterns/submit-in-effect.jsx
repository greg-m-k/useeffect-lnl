// PATTERN: Event logic in an effect.
// Clicking the button sets `submitted`, and an effect places the order whenever `submitted` is
// true. `submitted` lives above the form (in a router, a store or a parent), so it is still true
// when the user leaves and comes back. The form mounts again, the effect runs again, and the
// order is placed again.
import { useEffect } from "react";

export function CheckoutForm({ submitted, setSubmitted, postOrder }) {
  useEffect(() => {
    if (submitted) postOrder();
  }, [submitted, postOrder]);

  return (
    <div className="checkout">
      <button className="primary" onClick={() => setSubmitted(true)} disabled={submitted}>Place order</button>
      <span className="status">{submitted ? "Order placed" : "Not ordered yet"}</span>
    </div>
  );
}
