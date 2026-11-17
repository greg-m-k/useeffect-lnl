// PATTERN: Fetch in an effect, without cleanup.
// When `query` changes, fetch results for it and store whatever comes back. If an older request
// answers after a newer one, its results overwrite the newer ones, and the page shows results for
// a query the user has already replaced.
import { useEffect, useState } from "react";

export function Results({ query, fetchResults }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!query) return;
    fetchResults(query).then((d) => setData(d));
  }, [query, fetchResults]);

  return (
    <div className="results">
      <div className="pane-title">Showing results for <b data-testid="results-for">{data?.q ?? ""}</b></div>
      <ul>{data?.results.map((r) => <li key={r}>{r}</li>)}</ul>
    </div>
  );
}
