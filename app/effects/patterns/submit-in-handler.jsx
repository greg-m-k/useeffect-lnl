// PATTERN: Event logic in the event handler.
// The order is placed by the click itself. `submitted` still records that it happened, for the
// screen to show, but nothing runs because a component mounted. Leaving and coming back places
// no second order.
export function CheckoutForm({ submitted, setSubmitted, postOrder }) {
  function placeOrder() {
    postOrder();
    setSubmitted(true);
  }

  return (
    <div className="checkout">
      <button className="primary" onClick={placeOrder} disabled={submitted}>Place order</button>
      <span className="status">{submitted ? "Order placed" : "Not ordered yet"}</span>
    </div>
  );
}
