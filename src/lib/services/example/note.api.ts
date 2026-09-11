import {
  err,
  internal,
  invalid,
  narrow,
  optional,
  absentWhenType,
  type Result,
  type TransportFailure,
  type Fails,
} from "../../kernel";
import {
  responseDecoder,
  responseObject,
  responseText,
  type CallOptions,
  type HttpClient,
} from "../../http";
import type { NoteAttempt, NoteReceipt } from "./note.types";

/** TERMINAL absence: the backend guarantees this operation did not commit and
 * cannot commit later. A bare 404, an eventually consistent receipt index, or
 * "still processing" cannot supply this answer. They leave the outcome unknown.
 * The isolated fixture has no background writes, so it can make this promise.
 */
export const NO_NOTE_SAVE = "no_note_save";
export type NoteSaveFailure = TransportFailure | Fails<"invalid" | "conflict">;
const asSave = narrow("invalid", "conflict");
const asRead = narrow("not_found");
const decodeReceipt = responseDecoder(
  "note receipt",
  (value): NoteReceipt | undefined => {
    const receipt = responseObject(value);
    const draft = responseObject(receipt?.draft);
    if (
      !receipt ||
      !draft ||
      !responseText(receipt.operationId) ||
      !responseText(draft.title) ||
      typeof draft.body !== "string" ||
      typeof receipt.revision !== "number" ||
      !Number.isSafeInteger(receipt.revision) ||
      receipt.revision < 1
    )
      return undefined;
    return {
      operationId: receipt.operationId,
      revision: receipt.revision,
      draft: { title: draft.title, body: draft.body },
    };
  },
);

/** The example backend must deduplicate an operation id with identical content.
 * A Failure alone cannot prove that a write was not committed. Callers retain
 * the attempt and reconcile its receipt before issuing a fresh operation.
 */
export async function saveNote(
  client: HttpClient,
  attempt: NoteAttempt,
  options?: CallOptions,
): Promise<Result<NoteReceipt, NoteSaveFailure>> {
  if (!attempt.draft.title.trim())
    return err(invalid("A title is required.", { title: "Enter a title." }));
  const result = (
    await client.put<unknown>("/example/note", {
      body: attempt,
      signal: options?.signal,
      trace: options?.trace,
    })
  )
    .andThen((value) => decodeReceipt(value, options?.trace))
    .mapErr(asSave);
  if (
    result.ok &&
    (result.value.operationId !== attempt.operationId ||
      result.value.draft.title !== attempt.draft.title ||
      result.value.draft.body !== attempt.draft.body)
  ) {
    return err(
      internal("The save receipt did not match the submitted note.", {
        type: "invalid_response",
      }),
    );
  }
  return result;
}

export async function findNoteSave(
  client: HttpClient,
  operationId: string,
  options?: CallOptions,
): Promise<Result<NoteReceipt | null, TransportFailure>> {
  const result = await optional(
    (
      await client.get<unknown>(
        `/example/note-saves/${encodeURIComponent(operationId)}`,
        {
          signal: options?.signal,
          trace: options?.trace,
        },
      )
    )
      .andThen((value) => decodeReceipt(value, options?.trace))
      .mapErr(asRead),
    absentWhenType(NO_NOTE_SAVE),
  );
  if (
    result.ok &&
    result.value !== null &&
    result.value.operationId !== operationId
  ) {
    return err(
      internal("The save receipt did not match the requested operation.", {
        type: "invalid_response",
      }),
    );
  }
  return result;
}
