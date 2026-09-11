import { createSequenceClient, type SequenceStep } from "../chaos";
import { createMemoryClient, withDiagnostics } from "../http";
import type { DiagnosticTrace } from "../diagnostics";
import { err, invalid, ok, timeout, unavailable } from "../kernel";
import { listItems } from "../services/example";
import { findNoteSave, saveNote } from "../services/example/note.api";
import { createNoteFixtures } from "../services/example/note.fixtures";
import type { NoteAttempt } from "../services/example/note.types";

export type ResponseMode =
  "valid" | "malformed" | "partial" | "unavailable" | "empty" | "held";
export type SaveMode =
  "success" | "refused" | "lost-response" | "not-delivered";

/** Explicit, isolated cookbook composition roots. Never use the real backend,
 * session cookie, application fixtures, or a URL-provided chaos plan.
 * Imported by the recipe only, so other consumers of lib/root do not ship it.
 */
export async function readResponseExample(
  mode: ResponseMode,
  signal: AbortSignal,
  trace?: DiagnosticTrace,
) {
  const items = [
    { id: "api", name: "API service", host: "api.example.com" },
    { id: "jobs", name: "Background jobs", host: "jobs.example.com" },
  ];
  const effects: Record<ResponseMode, SequenceStep["effect"] | undefined> = {
    valid: undefined,
    malformed: { kind: "reply", value: { data: items } },
    partial: { kind: "reply", value: [items[0], { id: "broken", name: 42 }] },
    unavailable: {
      kind: "fail",
      failure: unavailable("The simulated data source is unavailable."),
    },
    empty: { kind: "reply", value: [] },
    held: { kind: "hold-response", gate: "until-canceled" },
  };
  const effect = effects[mode];
  const sequence = createSequenceClient(
    createMemoryClient({
      latencyMs: 0,
      routes: [
        { method: "GET", pattern: /^\/items$/, handle: () => ok(items) },
      ],
      getCorrelationId: () => trace?.correlationId,
    }),
    effect ? [{ request: "GET /items", effect }] : [],
  );
  try {
    return await listItems(withDiagnostics(sequence.client), "response-demo", {
      signal,
      trace,
    });
  } finally {
    sequence.dispose();
  }
}

export function createRaceExample() {
  const sequence = createSequenceClient(
    createMemoryClient({
      latencyMs: 0,
      routes: [
        {
          method: "GET",
          pattern: /^\/items$/,
          handle: (request) =>
            ok(
              request.params?.workspace === "earlier"
                ? [
                    {
                      id: "earlier",
                      name: "Earlier selection",
                      host: "earlier.example.com",
                    },
                  ]
                : [
                    {
                      id: "newer",
                      name: "Newer selection",
                      host: "newer.example.com",
                    },
                  ],
            ),
        },
      ],
    }),
    [
      {
        request: "GET /items",
        effect: { kind: "hold-response", gate: "earlier", ignoreAbort: true },
      },
    ],
  );
  return {
    read: (selection: "earlier" | "newer", signal: AbortSignal) =>
      listItems(sequence.client, selection, { signal }),
    release: () => sequence.release("earlier"),
    dispose: sequence.dispose,
  };
}

export function createNoteExample() {
  const fixtures = createNoteFixtures();
  const client = createMemoryClient({ routes: fixtures.routes, latencyMs: 0 });
  let saveMode: SaveMode = "lost-response";
  let failChecks = false;
  return {
    setSaveMode(mode: SaveMode) {
      saveMode = mode;
    },
    failChecks(fail: boolean) {
      failChecks = fail;
    },
    committed: fixtures.committed,
    async save(attempt: NoteAttempt, signal: AbortSignal) {
      const effects: Record<SaveMode, SequenceStep["effect"] | undefined> = {
        success: undefined,
        refused: {
          kind: "fail",
          failure: invalid("The simulated server refused this title.", {
            title: "Choose another title or change the simulation.",
          }),
        },
        "lost-response": {
          kind: "lose-response",
          failure: timeout("The save response did not arrive."),
        },
        "not-delivered": {
          kind: "fail",
          failure: unavailable(
            "The request could not reach the simulated server.",
          ),
        },
      };
      const effect = effects[saveMode];
      const sequence = createSequenceClient(
        client,
        effect ? [{ request: "PUT /example/note", effect }] : [],
      );
      try {
        return await saveNote(sequence.client, attempt, { signal });
      } finally {
        sequence.dispose();
      }
    },
    find: (id: string, signal: AbortSignal) =>
      failChecks
        ? Promise.resolve(
            err(
              unavailable(
                "The save receipt could not be checked. Try checking again.",
              ),
            ),
          )
        : findNoteSave(client, id, { signal }),
  };
}
