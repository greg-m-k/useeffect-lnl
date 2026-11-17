// PATTERN: Reset state in an effect when a prop changes.
// The editor keeps a draft of the user's name. When a different user is selected, an effect
// copies the new name into the draft. The effect runs after React has already rendered and
// committed the new user with the old draft, so for one commit the header names one user and the
// draft belongs to another.
import { useEffect, useLayoutEffect, useState } from "react";

export function ProfileEditor({ user, onCommit }) {
  const [draft, setDraft] = useState({ owner: user.id, text: user.name });

  useEffect(() => {
    setDraft({ owner: user.id, text: user.name });
  }, [user.id, user.name]);

  // Measurement for the lesson page: report what each commit put on screen.
  useLayoutEffect(() => { onCommit?.({ user: user.id, draftOwner: draft.owner, stale: draft.owner !== user.id }); });

  return (
    <div className="editor">
      <h3>Editing <span data-testid="editing">{user.name}</span></h3>
      <input value={draft.text} onChange={(e) => setDraft({ owner: user.id, text: e.target.value })} aria-label="Name" />
    </div>
  );
}
