// PATTERN: Reset state with a key.
// The parent gives the editor a key of the user's id. A different key makes React treat it as a
// different component: the old editor and its state are thrown away and a new one starts from the
// new user's name in the same render. No commit ever shows one user's draft under another's name.
import { useLayoutEffect, useState } from "react";

export function ProfileEditor({ user, onCommit }) {
  return <Editor key={user.id} user={user} onCommit={onCommit} />;
}

function Editor({ user, onCommit }) {
  const [draft, setDraft] = useState({ owner: user.id, text: user.name });

  // Measurement for the lesson page: report what each commit put on screen.
  useLayoutEffect(() => { onCommit?.({ user: user.id, draftOwner: draft.owner, stale: draft.owner !== user.id }); });

  return (
    <div className="editor">
      <h3>Editing <span data-testid="editing">{user.name}</span></h3>
      <input value={draft.text} onChange={(e) => setDraft({ owner: user.id, text: e.target.value })} aria-label="Name" />
    </div>
  );
}
