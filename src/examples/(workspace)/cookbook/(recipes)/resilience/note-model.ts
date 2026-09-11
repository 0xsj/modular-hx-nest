import {
  createSaveDraft,
  type DraftPhase,
  type DraftPort,
  type DraftState,
} from "~/lib/runtime/save-draft";
import type {
  NoteAttempt,
  NoteDraft,
  NoteReceipt,
} from "~/lib/services/example/note.types";

export type NotePhase = DraftPhase<NoteAttempt>;
export type NoteState = DraftState<NoteDraft, NoteAttempt, NoteReceipt>;
export const sameDraft = (a: NoteDraft, b: NoteDraft) =>
  a.title === b.title && a.body === b.body;

/** The note supplies domain equality; save/reconciliation policy is shared. */
export function createNoteModel(
  port: DraftPort<NoteAttempt, NoteReceipt>,
  initial: NoteDraft,
  newId: () => string = () => crypto.randomUUID(),
) {
  return createSaveDraft(port, initial, {
    same: sameDraft,
    newId,
    attempt: (draft, operationId) => ({ draft, operationId }),
  });
}
