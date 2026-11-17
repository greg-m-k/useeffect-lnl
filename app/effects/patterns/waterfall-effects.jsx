// PATTERN: Each component fetches its own data in an effect.
// The page fetches the customer, and only renders the orders list once the customer has
// arrived. The orders list then fetches its own data in its own effect. The second request
// cannot start until the first has finished: a network waterfall, slower on every connection
// and worst on slow ones.
import { useEffect, useState } from "react";

export function CustomerPage({ id, getCustomer, getOrders }) {
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    let ignore = false;
    getCustomer(id).then((c) => { if (!ignore) setCustomer(c); });
    return () => { ignore = true; };
  }, [id, getCustomer]);

  if (!customer) return <p className="status">Loading customer…</p>;
  return (
    <div>
      <h3>{customer.name}</h3>
      <Orders customerId={customer.id} getOrders={getOrders} />
    </div>
  );
}

function Orders({ customerId, getOrders }) {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    let ignore = false;
    getOrders(customerId).then((o) => { if (!ignore) setOrders(o.orders); });
    return () => { ignore = true; };
  }, [customerId, getOrders]);

  if (!orders) return <p className="status">Loading orders…</p>;
  return <ul>{orders.map((o) => <li key={o.id}>{o.id}: ${o.total}</li>)}</ul>;
}
