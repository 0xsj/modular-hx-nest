import { conflict, err, invalid, notFound, ok } from "../../kernel";
import { responseObject, responseText, type MemoryRoute } from "../../http";
import { NO_NOTE_SAVE } from "./note.api";
import type { NoteReceipt } from "./note.types";

/** One simulated server per demonstration. No module-global fixture state. */
export function createNoteFixtures() {
  const receipts = new Map<string, NoteReceipt>();
  let writes = 0;
  const routes: MemoryRoute[] = [
    {
      method: "PUT",
      pattern: /^\/example\/note$/,
      handle(request) {
        const attempt = responseObject(request.body);
        const draft = responseObject(attempt?.draft);
        if (
          !attempt ||
          !responseText(attempt.operationId) ||
          !draft ||
          !responseText(draft.title) ||
          typeof draft.body !== "string"
        ) {
          return err(
            invalid("The note is incomplete.", { title: "Enter a title." }),
          );
        }
        const previous = receipts.get(attempt.operationId);
        if (previous)
          return previous.draft.title === draft.title &&
            previous.draft.body === draft.body
            ? ok(structuredClone(previous))
            : err(conflict("This operation id belongs to a different note."));
        writes++;
        const receipt: NoteReceipt = {
          operationId: attempt.operationId,
          draft: { title: draft.title, body: draft.body },
          revision: writes,
        };
        receipts.set(attempt.operationId, receipt);
        return ok(structuredClone(receipt));
      },
    },
    {
      method: "GET",
      pattern: /^\/example\/note-saves\/([^/]+)$/,
      handle(_request, match) {
        const receipt = receipts.get(decodeURIComponent(match[1]));
        return receipt
          ? ok(structuredClone(receipt))
          : err(
              notFound("No save was recorded for this operation.", {
                type: NO_NOTE_SAVE,
              }),
            );
      },
    },
  ];
  return { routes, committed: () => writes };
}
