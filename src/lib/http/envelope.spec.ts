/* eslint-disable @typescript-eslint/no-explicit-any --
 * Written behind an information barrier: the oracle stated the decoded failure's
 * classification and message fields and nothing else, so the suite reaches the
 * per-kind payloads through an unknown shape. Retyping them would mean asserting
 * a shape the writer was never told — the runner supplying the oracle after the
 * fact. See custody/evidence/0004/entry.md § Prediction. */
/* RUNNER CORRECTION — see custody/evidence/0004/entry.md § Result.
 *
 * The suite read the DECODED FAILURE's identifiers under their WIRE key names
 * (`request_id`, `correlation_id`, `retry_after`). The wire keys are what a
 * server sends; the decoded failure names the same facts `requestId`,
 * `correlationId` and `retryAfter`, per the kernel specification's F3.
 *
 * The conflation was caused by this run's oracle, not by the writer. The prompt
 * said "other fields are named in the spec below" and the spec below (H6b) names
 * only the wire document — the output shape was never supplied. Same class of
 * defect as the one recorded in custody 0002: an ORACLE ASSEMBLY error by the
 * runner.
 *
 * Corrected against the kernel's F3, which is a specification, not the
 * implementation. Eleven sites moved. SIX were failing; the other FIVE were
 * absence tests asserting `undefined`, which PASSED VACUOUSLY against a field
 * name that does not exist — the exact failure mode custody 0002's writer
 * predicted for a misnamed field. */
import { describe, expect, test } from "vitest";
import {
  failureFromResponse,
  REQUEST_ID_HEADER,
  CORRELATION_HEADER,
} from "./index";
import { FAILURE_KINDS } from "~/lib/kernel";

// Every call site casts the decoded value to `any`. The exported `Failure`
// type is not part of the oracle given to this suite, and the spec (H6b)
// treats the wire document's shape as the contract under test, not the
// TypeScript type. Casting keeps that contract legible without guessing at
// a type this suite was never shown.
async function decode(response: Response): Promise<any> {
  return failureFromResponse(response) as unknown as Promise<any>;
}

function isKnownKind(kind: unknown): boolean {
  return (
    typeof kind === "string" &&
    (FAILURE_KINDS as readonly string[]).includes(kind)
  );
}

// -----------------------------------------------------------------------
// H6 · decoding a response is TOTAL
// -----------------------------------------------------------------------
describe("H6 - decoding a response is total: it never throws and always produces a sayable failure", () => {
  const cases: Array<[string, () => Response]> = [
    ["an empty body", () => new Response("", { status: 500 })],
    ["a null body", () => new Response(null, { status: 500 })],
    [
      "an HTML error page instead of JSON",
      () =>
        new Response("<html><body>Bad Gateway</body></html>", { status: 502 }),
    ],
    [
      "truncated JSON that cannot be parsed",
      () => new Response('{"kind": "invalid", "message":', { status: 400 }),
    ],
  ];

  for (const [name, make] of cases) {
    test(`does not throw and yields a classified, sayable failure for ${name}`, async () => {
      const failure = await decode(make());
      expect(isKnownKind(failure.kind)).toBe(
        true,
        // message carried via toBe's actual signature is unused; kept for clarity below
      );
      expect(typeof failure.message).toBe("string");
      expect(failure.message.length > 0).toBe(true);
    });
  }

  test("does not throw and yields a classified, sayable failure for a body that was already consumed", async () => {
    const resp = new Response(
      JSON.stringify({ kind: "invalid", message: "already gone" }),
      {
        status: 400,
      },
    );
    // Consume the body stream before the decoder ever sees it, so any
    // attempt by the decoder to read it again fails internally. H6 says
    // that internal failure must not itself surface as a thrown error.
    await resp.text();

    const failure = await decode(resp);
    expect(isKnownKind(failure.kind)).toBe(true);
    expect(
      typeof failure.message === "string" && failure.message.length > 0,
    ).toBe(true);
  });
});

// -----------------------------------------------------------------------
// H10 · the message has a fallback chain and always ends in something sayable
// -----------------------------------------------------------------------
describe("H10 - the message falls back through the document, then status text, then a fixed string", () => {
  test("uses the body message verbatim when present", async () => {
    const resp = new Response(
      JSON.stringify({ message: "exact server wording" }),
      {
        status: 400,
      },
    );
    const failure = await decode(resp);
    expect(failure.message).toBe("exact server wording");
  });

  test("falls back to detail when message is absent", async () => {
    const resp = new Response(
      JSON.stringify({ detail: "problem-document detail" }),
      {
        status: 400,
      },
    );
    const failure = await decode(resp);
    expect(failure.message).toBe("problem-document detail");
  });

  test("falls back to title when message and detail are both absent", async () => {
    const resp = new Response(
      JSON.stringify({ title: "problem-document title" }),
      {
        status: 400,
      },
    );
    const failure = await decode(resp);
    expect(failure.message).toBe("problem-document title");
  });

  test("prefers detail over title when both are present and message is absent, because detail is read first", async () => {
    const resp = new Response(
      JSON.stringify({ detail: "detail-wins", title: "title-loses" }),
      {
        status: 400,
      },
    );
    const failure = await decode(resp);
    expect(failure.message).toBe("detail-wins");
  });

  test("falls back to the response status text when the body supplies no message, detail or title", async () => {
    const resp = new Response(JSON.stringify({}), {
      status: 404,
      statusText: "Custom Not Found Phrase",
    });
    const failure = await decode(resp);
    expect(failure.message).toBe("Custom Not Found Phrase");
  });

  test("falls back to a fixed, non-empty string when the body and status text both carry nothing sayable", async () => {
    // Fetch's default statusText, when none is supplied, is the empty
    // string - so this exercises the last link in the chain.
    const resp = new Response(JSON.stringify({}), { status: 500 });
    const failure = await decode(resp);
    expect(typeof failure.message).toBe("string");
    expect(failure.message.length > 0).toBe(true);
  });

  test("ignores a message of the wrong wire type rather than refusing the whole document, and continues the fallback chain", async () => {
    const resp = new Response(
      JSON.stringify({ message: 12345, detail: "fell through to detail" }),
      {
        status: 400,
      },
    );
    const failure = await decode(resp);
    expect(failure.message).toBe("fell through to detail");
  });
});

// -----------------------------------------------------------------------
// H7 · the body's classification wins over the status code
// -----------------------------------------------------------------------
describe("H7 - a body that states its kind is trusted over the status code, whatever that status is", () => {
  test("every recognised kind survives unchanged across two very different status codes", async () => {
    for (const kind of FAILURE_KINDS as readonly string[]) {
      const respA = new Response(JSON.stringify({ kind }), { status: 400 });
      const respB = new Response(JSON.stringify({ kind }), { status: 503 });

      const failureA = await decode(respA);
      const failureB = await decode(respB);

      expect(failureA.kind).toBe(kind);
      expect(failureB.kind).toBe(kind);
    }
  });
});

// -----------------------------------------------------------------------
// H8 · an unrecognised kind is preserved, never discarded
// -----------------------------------------------------------------------
describe("H8 - an unrecognised kind reclassifies from status but is never silently thrown away", () => {
  test("a kind this client does not know is kept, verbatim, in `type`, while `kind` stays inside the closed set", async () => {
    const rawKind = "this-is-not-a-real-kind-xyz";
    // Guard our own fixture: the raw value must genuinely be outside the
    // closed set, or this test would not be exercising H8 at all.
    expect((FAILURE_KINDS as readonly string[]).includes(rawKind)).toBe(false);

    const resp = new Response(
      JSON.stringify({ kind: rawKind, message: "still readable" }),
      {
        status: 400,
      },
    );
    const failure = await decode(resp);

    expect(failure.type).toBe(rawKind);
    expect(isKnownKind(failure.kind)).toBe(true);
    expect(failure.kind).not.toBe(rawKind);
  });

  test("a kind of the wrong wire type is ignored rather than trusted, and classification still lands in the closed set", async () => {
    const resp = new Response(
      JSON.stringify({ kind: 12345, message: "still readable" }),
      {
        status: 400,
      },
    );
    const failure = await decode(resp);
    expect(isKnownKind(failure.kind)).toBe(true);
  });
});

// -----------------------------------------------------------------------
// H9 · status maps to behaviour, not to a catalogue
// -----------------------------------------------------------------------
describe("H9 - the status-to-kind mapping is total, deterministic, and closed", () => {
  const candidateStatuses = [
    400, 401, 403, 404, 405, 408, 409, 410, 412, 415, 422, 429, 500, 501, 502,
    503, 504, 507, 510, 599,
  ];

  test("every status, when the body does not classify itself, still resolves to a member of the closed set of kinds", async () => {
    for (const status of candidateStatuses) {
      const resp = new Response(JSON.stringify({}), { status });
      const failure = await decode(resp);
      expect(isKnownKind(failure.kind)).toBe(true);
    }
  });

  test("the same status, with the same non-classifying body, always yields the same kind", async () => {
    const status = 502;
    const respA = new Response(JSON.stringify({}), { status });
    const respB = new Response(JSON.stringify({}), { status });

    const failureA = await decode(respA);
    const failureB = await decode(respB);

    expect(failureA.kind).toBe(failureB.kind);
  });

  // INFERENCE: the spec deliberately withholds the status->kind table and
  // tells the suite to assert properties instead of a table (H9). Status
  // 599 is chosen as a status this client is very unlikely to have given
  // any behavioural meaning to, to exercise the fail-closed default named
  // in H9 ("anything with no behavioural meaning to this client is
  // internal"). If the implementation happens to have mapped 599, or uses
  // a different literal for its catch-all, this is the test that fails,
  // and that is a finding about the choice of probe, not necessarily
  // about the mapping's correctness.
  test("[inference] a status with no assigned behavioural meaning falls back to `internal`", async () => {
    const resp = new Response(JSON.stringify({}), { status: 599 });
    const failure = await decode(resp);
    expect(failure.kind).toBe("internal");
  });
});

// -----------------------------------------------------------------------
// H11 · identifiers fall back to headers
// -----------------------------------------------------------------------
describe("H11 - request and correlation identifiers fall back to response headers", () => {
  test("a request id in the body is used, even when the header disagrees", async () => {
    const resp = new Response(JSON.stringify({ request_id: "body-req-id" }), {
      status: 400,
      headers: { [REQUEST_ID_HEADER]: "header-req-id" },
    });
    const failure = await decode(resp);
    expect(failure.requestId).toBe("body-req-id");
  });

  test("a request id absent from the body is read from the request-id header", async () => {
    const resp = new Response(JSON.stringify({}), {
      status: 400,
      headers: { [REQUEST_ID_HEADER]: "header-req-id-2" },
    });
    const failure = await decode(resp);
    expect(failure.requestId).toBe("header-req-id-2");
  });

  // INFERENCE: the spec states the "absent, not zero" rule explicitly only
  // for retry_after (H12). It never says what an identifier absent from
  // both the body and the header becomes. `undefined` is assumed by
  // analogy rather than stated; flagged rather than silently baked in.
  test("[inference] a request id absent from both the body and the header is absent, not a placeholder", async () => {
    const resp = new Response(JSON.stringify({}), { status: 400 });
    const failure = await decode(resp);
    expect(failure.requestId).toBeUndefined();
  });

  test("a correlation id in the body is used, even when the header disagrees", async () => {
    const resp = new Response(
      JSON.stringify({ correlation_id: "body-corr-id" }),
      {
        status: 400,
        headers: { [CORRELATION_HEADER]: "header-corr-id" },
      },
    );
    const failure = await decode(resp);
    expect(failure.correlationId).toBe("body-corr-id");
  });

  test("a correlation id absent from the body is read from the correlation header, since it is an echo the client itself sent", async () => {
    const resp = new Response(JSON.stringify({}), {
      status: 400,
      headers: { [CORRELATION_HEADER]: "header-corr-id-2" },
    });
    const failure = await decode(resp);
    expect(failure.correlationId).toBe("header-corr-id-2");
  });

  // INFERENCE: same reasoning as the request-id absence case above.
  test("[inference] a correlation id absent from both the body and the header is absent, not a placeholder", async () => {
    const resp = new Response(JSON.stringify({}), { status: 400 });
    const failure = await decode(resp);
    expect(failure.correlationId).toBeUndefined();
  });
});

// -----------------------------------------------------------------------
// H12 · per-kind payloads are populated only where they belong
// -----------------------------------------------------------------------
describe("H12 - fields and retry_after are populated only for the kind they belong to", () => {
  test("`fields` is present but empty for `invalid` when the server named none", async () => {
    const resp = new Response(JSON.stringify({ kind: "invalid" }), {
      status: 400,
    });
    const failure = await decode(resp);
    expect(typeof failure.fields === "object" && failure.fields !== null).toBe(
      true,
    );
    expect(Object.keys(failure.fields).length).toBe(0);
  });

  test("`fields` carries the server-named field-to-message map for `invalid`", async () => {
    const resp = new Response(
      JSON.stringify({
        kind: "invalid",
        fields: { email: "is not a valid address" },
      }),
      { status: 400 },
    );
    const failure = await decode(resp);
    expect(failure.fields.email).toBe("is not a valid address");
  });

  test("a `fields` value of the wrong wire type is ignored rather than trusted, leaving `fields` present but empty", async () => {
    const resp = new Response(
      JSON.stringify({ kind: "invalid", fields: "not-a-map" }),
      {
        status: 400,
      },
    );
    const failure = await decode(resp);
    expect(typeof failure.fields === "object" && failure.fields !== null).toBe(
      true,
    );
    expect(Object.keys(failure.fields).length).toBe(0);
  });

  test("`fields` is built for `invalid` and for nothing else, even when another kind supplies it", async () => {
    for (const kind of FAILURE_KINDS as readonly string[]) {
      if (kind === "invalid") continue;
      const resp = new Response(
        JSON.stringify({ kind, fields: { unexpected: "should not surface" } }),
        { status: 400 },
      );
      const failure = await decode(resp);
      expect(failure.fields).toBeUndefined();
    }
  });

  test("`retry_after` is read from the body for `rate_limited`", async () => {
    const resp = new Response(
      JSON.stringify({ kind: "rate_limited", retry_after: 30 }),
      {
        status: 429,
      },
    );
    const failure = await decode(resp);
    // Coerced to string for comparison: the spec states the value (30
    // seconds) but not the wire type of the decoded field, so this
    // checks the value survived without asserting a type it was never
    // given.
    expect(String(failure.retryAfter)).toBe("30");
  });

  test("`retry_after` falls back to the standard Retry-After header when the body carries none", async () => {
    const resp = new Response(JSON.stringify({ kind: "rate_limited" }), {
      status: 429,
      headers: { "Retry-After": "45" },
    });
    const failure = await decode(resp);
    expect(String(failure.retryAfter)).toBe("45");
  });

  test("`retry_after` is absent, not zero, when neither the body nor the header carries one", async () => {
    const resp = new Response(JSON.stringify({ kind: "rate_limited" }), {
      status: 429,
    });
    const failure = await decode(resp);
    expect(failure.retryAfter).toBeUndefined();
  });

  test("a `retry_after` value of the wrong wire type is ignored rather than trusted, and no header rescues it here", async () => {
    const resp = new Response(
      JSON.stringify({ kind: "rate_limited", retry_after: "soon" }),
      {
        status: 429,
      },
    );
    const failure = await decode(resp);
    expect(failure.retryAfter).toBeUndefined();
  });

  test("`retry_after` is read for `rate_limited` and for nothing else, even when another kind supplies it", async () => {
    for (const kind of FAILURE_KINDS as readonly string[]) {
      if (kind === "rate_limited") continue;
      const resp = new Response(JSON.stringify({ kind, retry_after: 99 }), {
        status: 400,
      });
      const failure = await decode(resp);
      expect(failure.retryAfter).toBeUndefined();
    }
  });
});

// -----------------------------------------------------------------------
// H6b · the backend-specific `type` field is carried through as given
// -----------------------------------------------------------------------
describe("H6b - the backend-specific `type` field is read from the document as its own key", () => {
  test("an explicit `type` value is carried through unchanged alongside a recognised kind", async () => {
    const resp = new Response(
      JSON.stringify({ kind: "invalid", type: "SOME_BACKEND_CONDITION" }),
      {
        status: 400,
      },
    );
    const failure = await decode(resp);
    expect(failure.type).toBe("SOME_BACKEND_CONDITION");
  });
});
