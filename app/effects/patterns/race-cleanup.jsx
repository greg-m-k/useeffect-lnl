// PATTERN: Fetch in an effect, with cleanup.
// The same effect, plus a cleanup function. React runs the cleanup before the effect runs again
// for a new query, so the older request's answer is ignored when it arrives. The page always
// shows results for the latest query.
import { useEffect, useState } from "react";

export function Results({ query, fetchResults }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!query) return;
    let ignore = false;
    fetchResults(query).then((d) => { if (!ignore) setData(d); });
    return () => { ignore = true; };
  }, [query, fetchResults]);

  return (
    <div className="results">
      <div className="pane-title">Showing results for <b data-testid="results-for">{data?.q ?? ""}</b></div>
      <ul>{data?.results.map((r) => <li key={r}>{r}</li>)}</ul>
    </div>
  );
}
