// PATTERN: Fetch everything the page needs at once.
// Both requests need only the customer id, so the page starts them together and waits for both.
// The page is ready after the slower of the two. A route loader or a data library does the same
// thing earlier still, before the page renders at all.
import { useEffect, useState } from "react";

export function CustomerPage({ id, getCustomer, getOrders }) {
  const [page, setPage] = useState(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([getCustomer(id), getOrders(id)]).then(([customer, o]) => {
      if (!ignore) setPage({ customer, orders: o.orders });
    });
    return () => { ignore = true; };
  }, [id, getCustomer, getOrders]);

  if (!page) return <p className="status">Loading customer and orders…</p>;
  return (
    <div>
      <h3>{page.customer.name}</h3>
      <ul>{page.orders.map((o) => <li key={o.id}>{o.id}: ${o.total}</li>)}</ul>
    </div>
  );
}
