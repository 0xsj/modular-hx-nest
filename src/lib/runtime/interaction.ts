import { createStore } from "./store";

/* The current interaction — the thing whose absence made a correlation id
 * meaningless on the client.
 *
 * An interaction is a USER ACTION, not a request and not a component lifetime.
 * A click that fans out into four requests is one interaction, and every
 * failure those four produce should name it. Scoped to a request, the id
 * degenerates into a second request id; scoped to a mount, it says only which
 * screen was open.
 *
 * This tier owns it because it is exactly what `CLAUDE.md` means by state the
 * shell owns and no server has an opinion about. */

const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `int-${Math.random().toString(36).slice(2, 10)}`;

/** Deliberately NOT minted at module load. On the server that would be one id
 *  shared by every request — one caller's interaction attributed to the next.
 *  The empty string means "no interaction has begun", which a caller can see. */
export const interaction = createStore<string>("");

/** Start one. Call this in the handler that begins a user action, then hand the
 *  id to the composition root.
 *
 *      const id = beginInteraction();
 *      const root = createRoot({ correlationId: id, ... });
 *
 *  Returns the id rather than requiring a second read, so the two cannot drift. */
export function beginInteraction(): string {
  const id = newId();
  interaction.set(id);
  return id;
}

/** The current one, beginning one if none has started. For a caller that wants
 *  to JOIN whatever is under way — a background refetch belonging to the click
 *  that triggered it — rather than start something new. */
export function currentInteraction(): string {
  return interaction.get() || beginInteraction();
}

/** For a shell that wants each navigation to be its own interaction. */
export function endInteraction(): void {
  interaction.set("");
}
