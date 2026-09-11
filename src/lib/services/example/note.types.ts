/** A cookbook specimen: visit-local drafts, backed by operation receipts. */
export type NoteDraft = { title: string; body: string };
export type NoteAttempt = { operationId: string; draft: NoteDraft };
export type NoteReceipt = NoteAttempt & { revision: number };
