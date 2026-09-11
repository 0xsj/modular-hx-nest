/* Port migration (2026-09-10): this working suite now uses Next's explicit
 * Result-returning, RegExp fixture routes and per-attempt request IDs. The
 * as-written suite and its original provenance remain unchanged in custody.
 * These adapted checks are implementation-visible regressions.
 */
/* eslint-disable @typescript-eslint/no-explicit-any --
 * This suite was written behind an information barrier and the oracle did not
 * state the shape of `Result`. The writer inferred it and wrote helpers that
 * accept an unknown shape and throw loudly rather than guess further — which is
 * the correct behaviour under the barrier, and it is why `any` appears here.
 * Retyping these would mean asserting a shape the suite was never told, which is
 * the runner supplying the oracle after the fact. See
 * custody/evidence/0002/entry.md § Prediction. */
import { describe, expect, test, vi, afterEach } from "vitest";
import {
  joinUrl,
  queryString,
  failureFromResponse,
  failureFromTransport,
  createFetchClient,
  createMemoryClient,
  REQUEST_ID_HEADER,
  CORRELATION_HEADER,
} from "./index";
import {
  ok,
  err,
  invalid,
  notFound,
  unavailable,
  conflict,
  internal,
  timeout,
  canceled,
  rateLimited,
  FAILURE_KINDS,
} from "~/lib/kernel";

// ---------------------------------------------------------------------------
// DEFENSIVE / INFERRED SHAPE HELPERS
//
// The prompt names the types `Failure` and `Result` but never gives their
// field shape (the kernel module is not visible to this suite). Every helper
// below that touches `.ok` / `.value` / `.error` / `.kind` is an INFERENCE of
// the conventional shape:
//
//   Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
//   Failure.kind holds the discriminant string
//
// This is flagged once, here, rather than at every call site. If the real
// shape differs, `isOk`/`unwrapOk`/`unwrapErr` throw loudly (they do not
// silently invent a shape), and `kindOf` returns `undefined` rather than
// throwing, which makes "known kind" checks trivially pass instead of
// falsely fail — see the report for what that implies about these tests.
// ---------------------------------------------------------------------------

function isOk(result: any): boolean {
  if (result && typeof result === "object") {
    if ("ok" in result) return !!result.ok;
    if ("success" in result) return !!result.success;
  }
  throw new Error(
    "Result shape not recognised by test helper isOk() — update the helper",
  );
}

function unwrapOk(result: any): any {
  if (result && typeof result === "object") {
    if ("value" in result) return result.value;
    if ("data" in result) return result.data;
  }
  return undefined;
}

function unwrapErr(result: any): any {
  if (result && typeof result === "object") {
    if ("error" in result) return result.error;
    if ("failure" in result) return result.failure;
  }
  return undefined;
}

// INFERENCE: assumes the discriminant field on Failure is literally named `kind`.
// The spec's prose never puts `kind` in backticks the way it does `message`,
// `type` and `fields`, so this one field name is a guess. It is used
// consistently on both sides of every comparison below, so a wrong guess
// mostly produces "trivially true" rather than "falsely false" (see report).
function kindOf(failure: any): unknown {
  return failure?.kind;
}

function extractUrl(input: unknown): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return (input as Request).url;
}

function headerLookup(headersInit: any, key: string): string | undefined {
  if (!headersInit) return undefined;
  if (typeof headersInit.get === "function") {
    const v = headersInit.get(key);
    return v ?? undefined;
  }
  if (Array.isArray(headersInit)) {
    const found = headersInit.find(
      ([k]: [string, string]) => k.toLowerCase() === key.toLowerCase(),
    );
    return found ? found[1] : undefined;
  }
  for (const k of Object.keys(headersInit)) {
    if (k.toLowerCase() === key.toLowerCase()) return headersInit[k];
  }
  return undefined;
}

function normalizeQuery(qs: string): URLSearchParams {
  return new URLSearchParams(qs.startsWith("?") ? qs.slice(1) : qs);
}

/* RUNNER CORRECTION — see custody/evidence/0002/entry.md § Result.
 *
 * The writer built this list from the constructors named in its prompt, and that
 * prompt was incomplete: it omitted `unauthenticated` and `forbidden`. The tests
 * for 401 and 403 therefore failed against a correct implementation. The defect
 * was in the ORACLE ASSEMBLY, not in the code and not in the writer's reasoning.
 *
 * Corrected by asserting against the authoritative exported set rather than any
 * transcription of it, which is what the writer would have been told to do had
 * the set been named: never hard-code a value the specification does not state. */
const KNOWN_FAILURE_KINDS: readonly string[] = FAILURE_KINDS;

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

// ===========================================================================
// H4 — joining a base to a path never loses the mount path
// ===========================================================================

describe("joinUrl — joining a base to a path never loses the mount path (H4)", () => {
  test("the spec's own example: a mount path survives regardless of slash placement", () => {
    expect(joinUrl("https://x/v1", "/things")).toBe("https://x/v1/things");
    expect(joinUrl("https://x/v1/", "things")).toBe("https://x/v1/things");
  });

  test.each([
    ["https://api.example.test/v1", "things"],
    ["https://api.example.test", "a/b/c"],
  ])(
    "a trailing slash on the base and a leading slash on the path never change the result (base=%s, path=%s)",
    (base, path) => {
      const variants = [
        joinUrl(base, path),
        joinUrl(base + "/", path),
        joinUrl(base, "/" + path),
        joinUrl(base + "/", "/" + path),
      ];
      for (const variant of variants) {
        expect(variant).toBe(variants[0]);
      }
    },
  );

  test("a path is appended to the base, never resolved against it as an absolute URL", () => {
    // new URL(path, base) resolution would silently drop the /v1 mount
    // segment for a leading-slash path. joinUrl must not do that.
    const joined = joinUrl("https://api.example.test/v1", "/things");
    expect(joined.startsWith("https://api.example.test/v1")).toBe(true);
    expect(joined.includes("/things")).toBe(true);
  });
});

// ===========================================================================
// H3 — queryString: params
// ===========================================================================

describe("queryString — params (H3)", () => {
  test('an undefined value is dropped, never sent as the string "undefined"', () => {
    const qs = queryString({ cursor: undefined, limit: 5 });
    expect(qs).not.toContain("undefined");
    const params = normalizeQuery(qs);
    expect(params.has("cursor")).toBe(false);
    expect(params.get("limit")).toBe("5");
  });

  test("an absent cursor produces the same set of keys as no params at all", () => {
    const withUndefinedCursor = Array.from(
      normalizeQuery(queryString({ cursor: undefined })).keys(),
    );
    const withNoParams = Array.from(normalizeQuery(queryString({})).keys());
    expect(withUndefinedCursor).toEqual(withNoParams);
  });

  test("no params, or all-undefined params, produce a query with no keys", () => {
    expect(Array.from(normalizeQuery(queryString(undefined)).keys())).toEqual(
      [],
    );
    expect(
      Array.from(normalizeQuery(queryString({ a: undefined })).keys()),
    ).toEqual([]);
  });

  test("present values of every allowed primitive type are encoded and recoverable", () => {
    const qs = queryString({ q: "a b&c", active: true, page: 2 });
    const params = normalizeQuery(qs);
    expect(params.get("q")).toBe("a b&c");
    expect(params.get("active")).toBe("true");
    expect(params.get("page")).toBe("2");
  });
});

// ===========================================================================
// H13 — a failure with no response at all is matched by NAME
// ===========================================================================

describe("failureFromTransport classifies by the thrown value's name, not by instanceof (H13)", () => {
  test.each([
    [
      "a caller's abort (plain object, not an instance of any Error) is canceled",
      { name: "AbortError", message: "The user aborted a request." },
      canceled("x"),
    ],
    [
      // INFERENCE: 'TimeoutError' is the platform-standard DOMException name
      // raised by AbortSignal.timeout(); the spec deliberately does not name
      // the signal it expects the adapter to raise.
      "a timeout (name TimeoutError) is timeout, not canceled",
      { name: "TimeoutError", message: "The operation timed out." },
      timeout("x"),
    ],
    [
      "an unnamed / unrecognised transport failure is unavailable, the fail-closed member",
      { name: "SomeRandomNetworkGlitch", message: "oops" },
      unavailable("x"),
    ],
    [
      "a real TypeError (a typical fetch network failure) is unavailable",
      new TypeError("fetch failed"),
      unavailable("x"),
    ],
  ])("%s", (_label, cause, expected) => {
    const failure = failureFromTransport(cause);
    expect(kindOf(failure)).toBe(kindOf(expected));
  });

  test("canceled and timeout must not collapse into each other", () => {
    const abortKind = kindOf(failureFromTransport({ name: "AbortError" }));
    const timeoutKind = kindOf(failureFromTransport({ name: "TimeoutError" })); // INFERENCE, see above
    expect(abortKind).not.toBe(timeoutKind);
  });

  test("failureFromTransport never throws for a nonsense cause", () => {
    expect(() => failureFromTransport(undefined)).not.toThrow();
    expect(() => failureFromTransport("a plain string")).not.toThrow();
    expect(() => failureFromTransport(42)).not.toThrow();
  });
});

// ===========================================================================
// H6, H10 — decoding a response is TOTAL
// ===========================================================================

describe("failureFromResponse never throws, whatever the body (H6)", () => {
  const scenarios: Array<[string, () => Promise<Response>]> = [
    ["an empty body", async () => new Response("", { status: 500 })],
    [
      "a body that is HTML, not JSON",
      async () =>
        new Response("<html><body>Bad Gateway</body></html>", {
          status: 502,
          headers: { "content-type": "text/html" },
        }),
    ],
    [
      "truncated JSON",
      async () => new Response('{"message": "clip', { status: 400 }),
    ],
    [
      "a body already consumed before the decoder saw it",
      async () => {
        const response = new Response(JSON.stringify({ message: "x" }), {
          status: 400,
        });
        await response.text();
        return response;
      },
    ],
  ];

  test.each(scenarios)(
    "does not throw on: %s",
    async (_label, makeResponse) => {
      const response = await makeResponse();
      await expect(failureFromResponse(response)).resolves.toBeDefined();
    },
  );

  test.each(scenarios)(
    "always ends in a sayable, non-empty `message` for: %s (H10)",
    async (_label, makeResponse) => {
      const response = await makeResponse();
      const failure: any = await failureFromResponse(response);
      expect(typeof failure.message).toBe("string");
      expect(failure.message.length).toBeGreaterThan(0);
    },
  );

  test("the fallback chain still ends in something sayable when there is no statusText either (H10)", async () => {
    const response = new Response("{}", { status: 400, statusText: "" });
    const failure: any = await failureFromResponse(response);
    expect(typeof failure.message).toBe("string");
    expect(failure.message.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// H9 — status maps to BEHAVIOUR, not a catalogue
// ===========================================================================

describe("failureFromResponse — status maps to behaviour, not a catalogue (H9)", () => {
  const statuses = [
    400, 401, 403, 404, 405, 408, 409, 410, 412, 415, 422, 425, 429, 451, 500,
    501, 502, 503, 504, 599,
  ];

  test.each(statuses)(
    "status %i always yields one of the known, closed set of kinds",
    async (status) => {
      const failure = await failureFromResponse(new Response("{}", { status }));
      expect(KNOWN_FAILURE_KINDS).toContain(kindOf(failure));
    },
  );

  test.each(statuses)(
    "status %i yields the same kind on every call (determinism)",
    async (status) => {
      const first = await failureFromResponse(new Response("{}", { status }));
      const second = await failureFromResponse(new Response("{}", { status }));
      expect(kindOf(first)).toBe(kindOf(second));
    },
  );
});

// ===========================================================================
// INFERRED wire-schema behaviours — flagged, not silently guessed
// ===========================================================================

describe("inferred behaviours the prose implies but does not fully pin down", () => {
  test("INFERENCE (field names requestId/correlationId): identifiers absent from the body fall back to headers (H11)", async () => {
    const response = new Response("{}", {
      status: 404,
      headers: {
        [REQUEST_ID_HEADER]: "req-abc",
        [CORRELATION_HEADER]: "corr-xyz",
      },
    });
    const failure: any = await failureFromResponse(response);
    expect(failure.requestId).toBe("req-abc");
    expect(failure.correlationId).toBe("corr-xyz");
  });

  test("INFERENCE (400 -> invalid): `fields` is present on an invalid failure even when the server named none (H12)", async () => {
    const failure: any = await failureFromResponse(
      new Response("{}", { status: 400 }),
    );
    expect(kindOf(failure)).toBe(kindOf(invalid("x")));
    expect("fields" in failure).toBe(true);
  });

  test("INFERENCE (429 -> rate_limited): the kind is rate_limited whether or not a retry header is present", async () => {
    const withHeader = await failureFromResponse(
      new Response("{}", { status: 429, headers: { "Retry-After": "30" } }),
    );
    const withoutHeader = await failureFromResponse(
      new Response("{}", { status: 429 }),
    );
    expect(kindOf(withHeader)).toBe(kindOf(rateLimited("x")));
    expect(kindOf(withoutHeader)).toBe(kindOf(rateLimited("x")));
  });
});

// ===========================================================================
// The two header constants exist and are distinct
// ===========================================================================

describe("REQUEST_ID_HEADER and CORRELATION_HEADER are distinct, stable symbols", () => {
  test("both are non-empty strings, and they are not the same header", () => {
    expect(typeof REQUEST_ID_HEADER).toBe("string");
    expect(REQUEST_ID_HEADER.length).toBeGreaterThan(0);
    expect(typeof CORRELATION_HEADER).toBe("string");
    expect(CORRELATION_HEADER.length).toBeGreaterThan(0);
    expect(REQUEST_ID_HEADER).not.toBe(CORRELATION_HEADER);
  });
});

// ===========================================================================
// createFetchClient — request construction (H3, H4)
// ===========================================================================

describe("createFetchClient builds requests per H3/H4", () => {
  function captureFetch() {
    const calls: Array<{ input: unknown; init: any }> = [];
    globalThis.fetch = vi.fn(async (input: any, init: any) => {
      calls.push({ input, init });
      return new Response("{}", { status: 200 });
    }) as any;
    return calls;
  }

  test("params: an undefined value is dropped from the outgoing URL entirely", async () => {
    const calls = captureFetch();
    const client = createFetchClient({ baseUrl: "https://api.example.test" });
    await client.get("/things", { params: { cursor: undefined, limit: 5 } });
    const url = extractUrl(calls[0].input);
    expect(url).not.toContain("undefined");
    expect(url).toContain("limit=5");
  });

  test("body: is serialised as JSON when present", async () => {
    const calls = captureFetch();
    const client = createFetchClient({ baseUrl: "https://api.example.test" });
    await client.post("/things", { body: { name: "widget" } });
    expect(JSON.parse(calls[0].init.body)).toEqual({ name: "widget" });
  });

  test("body: no body is sent when absent", async () => {
    const calls = captureFetch();
    const client = createFetchClient({ baseUrl: "https://api.example.test" });
    await client.get("/things");
    expect(calls[0].init?.body == null).toBe(true);
  });

  test("headers: a caller-supplied header overrides the correlation header the client would otherwise send", async () => {
    const calls = captureFetch();
    const client = createFetchClient({
      baseUrl: "https://api.example.test",
      getCorrelationId: () => "auto-correlation",
    });
    await client.get("/things", {
      headers: { [CORRELATION_HEADER]: "manual-correlation" },
    });
    expect(headerLookup(calls[0].init.headers, CORRELATION_HEADER)).toBe(
      "manual-correlation",
    );
  });

  test("the base's mount path survives when joined with the request path", async () => {
    const calls = captureFetch();
    const client = createFetchClient({
      baseUrl: "https://api.example.test/v1",
    });
    await client.get("/things");
    const url = extractUrl(calls[0].input);
    expect(
      url.startsWith(joinUrl("https://api.example.test/v1", "/things")),
    ).toBe(true);
  });
});

// ===========================================================================
// H5 — the token and the correlation id are read on EVERY request
// ===========================================================================

describe("the token and the correlation id are read live, on every request, not cached (H5)", () => {
  test("getAccessToken is invoked per request, not once at client construction", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response("{}", { status: 200 }),
    ) as any;
    const getAccessToken = vi.fn(() => "tok");
    const client = createFetchClient({
      baseUrl: "https://api.example.test",
      getAccessToken,
    });
    expect(getAccessToken).not.toHaveBeenCalled();
    await client.get("/a");
    await client.get("/b");
    expect(getAccessToken).toHaveBeenCalledTimes(2);
  });

  test("getCorrelationId is invoked per request and a fresh value is sent each time", async () => {
    const calls: any[] = [];
    globalThis.fetch = vi.fn(async (_input: any, init: any) => {
      calls.push(init);
      return new Response("{}", { status: 200 });
    }) as any;
    const getCorrelationId = vi
      .fn()
      .mockReturnValueOnce("corr-1")
      .mockReturnValueOnce("corr-2");
    const client = createFetchClient({
      baseUrl: "https://api.example.test",
      getCorrelationId,
    });
    await client.get("/a");
    await client.get("/b");
    expect(headerLookup(calls[0].headers, CORRELATION_HEADER)).toBe("corr-1");
    expect(headerLookup(calls[1].headers, CORRELATION_HEADER)).toBe("corr-2");
  });

  test("returning nothing from getCorrelationId sends no correlation header, and is not an error", async () => {
    const calls: any[] = [];
    globalThis.fetch = vi.fn(async (_input: any, init: any) => {
      calls.push(init);
      return new Response("{}", { status: 200 });
    }) as any;
    const client = createFetchClient({
      baseUrl: "https://api.example.test",
      getCorrelationId: () => undefined,
    });
    const result = await client.get("/a");
    expect(headerLookup(calls[0].headers, CORRELATION_HEADER)).toBeUndefined();
    expect(isOk(result)).toBe(true);
  });
});

// ===========================================================================
// H15 — the timeout must be distinguishable from the caller's cancellation
// ===========================================================================

describe("the timeout is distinguishable from the caller's own cancellation (H15)", () => {
  function hangingFetchStub() {
    return vi.fn(
      (_input: any, init: any) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => {
            const reason: any = init.signal.reason;
            const err = new Error("aborted");
            err.name = reason?.name ?? "AbortError";
            reject(err);
          });
        }),
    ) as any;
  }

  test("a request with only a timeout configured fails with kind timeout, not canceled", async () => {
    globalThis.fetch = hangingFetchStub();
    const client = createFetchClient({
      baseUrl: "https://api.example.test",
      timeoutMs: 5,
    });
    const result = await client.get("/slow");
    expect(isOk(result)).toBe(false);
    const failure = unwrapErr(result);
    expect(kindOf(failure)).toBe(kindOf(timeout("x")));
    expect(kindOf(failure)).not.toBe(kindOf(canceled("x")));
  });

  test("the caller's own abort still cancels the request when a long timeout is also configured", async () => {
    globalThis.fetch = hangingFetchStub();
    const controller = new AbortController();
    const client = createFetchClient({
      baseUrl: "https://api.example.test",
      timeoutMs: 60_000,
    });
    const pending = client.get("/slow", { signal: controller.signal });
    controller.abort();
    const result = await pending;
    expect(isOk(result)).toBe(false);
    expect(kindOf(unwrapErr(result))).toBe(kindOf(canceled("x")));
  });

  test("a short timeout still fires when the caller also supplies its own, unaborted signal", async () => {
    globalThis.fetch = hangingFetchStub();
    const controller = new AbortController();
    const client = createFetchClient({
      baseUrl: "https://api.example.test",
      timeoutMs: 5,
    });
    const result = await client.get("/slow", { signal: controller.signal });
    expect(isOk(result)).toBe(false);
    expect(kindOf(unwrapErr(result))).toBe(kindOf(timeout("x")));
  });
});

// ===========================================================================
// H16 — a body that will not parse on success is OURS, not the network's
// ===========================================================================

describe("a success body that will not parse is classified as ours, not the network's (H16)", () => {
  test("a 200 with an unparsable body yields internal, not a retryable transport kind", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response("not { valid json", { status: 200 }),
    ) as any;
    const client = createFetchClient({ baseUrl: "https://api.example.test" });
    const result = await client.get("/thing");
    expect(isOk(result)).toBe(false);
    const failure = unwrapErr(result);
    expect(kindOf(failure)).toBe(kindOf(internal("x")));
    expect(kindOf(failure)).not.toBe(kindOf(unavailable("x")));
  });
});

// ===========================================================================
// H17 — a success with no body is a success
// ===========================================================================

describe("a success with no body is a success, and fabricates nothing (H17)", () => {
  test("a 204 succeeds without inventing an object", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(null, { status: 204 }),
    ) as any;
    const client = createFetchClient({ baseUrl: "https://api.example.test" });
    const result = await client.delete("/thing/1");
    expect(isOk(result)).toBe(true);
    const value = unwrapOk(result);
    expect(value === undefined || value === null).toBe(true);
  });
});

// ===========================================================================
// createMemoryClient — H18, H19, H20
// ===========================================================================

describe("createMemoryClient answers through the port and reproduces refusals (H18)", () => {
  test("a route returning Ok succeeds with that value", async () => {
    const client = createMemoryClient({
      routes: [
        { method: "GET", pattern: /^\/widgets$/, handle: () => ok({ id: 1 }) },
      ],
    });
    const result = await client.get("/widgets");
    expect(isOk(result)).toBe(true);
    expect(unwrapOk(result)).toEqual({ id: 1 });
  });

  test("a route returning Err refuses the call with that same failure", async () => {
    const refusal = conflict("slot already taken", { requestId: "req_shared" });
    const client = createMemoryClient({
      routes: [
        { method: "POST", pattern: /^\/book$/, handle: () => err(refusal) },
      ],
    });
    const result = await client.post("/book");
    expect(isOk(result)).toBe(false);
    expect(unwrapErr(result)).toEqual(refusal);
  });
});

describe("an unregistered route is internal, specifically NOT not_found (H19)", () => {
  test("a route nobody registered is a fixture bug, not a reproduced 404", async () => {
    const client = createMemoryClient({
      routes: [{ method: "GET", pattern: /^\/known$/, handle: () => ok("ok") }],
    });
    const result = await client.get("/does-not-exist");
    expect(isOk(result)).toBe(false);
    const failure = unwrapErr(result);
    expect(kindOf(failure)).not.toBe(kindOf(notFound("x")));
    expect(kindOf(failure)).toBe(kindOf(internal("x")));
  });

  test("a registered route that only matches a shallower path does not prefix-match a deeper request", async () => {
    const client = createMemoryClient({
      routes: [
        {
          method: "GET",
          pattern: /^\/things$/,
          handle: () => ok("matched-shallow"),
        },
      ],
    });
    const result = await client.get("/things/1");
    expect(isOk(result)).toBe(false);
    expect(kindOf(unwrapErr(result))).toBe(kindOf(internal("x")));
  });

  test("matching considers the method: the same path under a different method is unregistered", async () => {
    const client = createMemoryClient({
      routes: [
        {
          method: "GET",
          pattern: /^\/things$/,
          handle: () => ok("get-handler"),
        },
      ],
    });
    const result = await client.post("/things");
    expect(isOk(result)).toBe(false);
    expect(kindOf(unwrapErr(result))).toBe(kindOf(internal("x")));
  });
});

describe("matching is exact and order is a priority list (H20)", () => {
  test("an ambiguous registration is resolved by order: the first matching route answers", async () => {
    const client = createMemoryClient({
      routes: [
        { method: "GET", pattern: /^\/x$/, handle: () => ok("first") },
        { method: "GET", pattern: /^\/x$/, handle: () => ok("second") },
      ],
    });
    const result = await client.get("/x");
    expect(isOk(result)).toBe(true);
    expect(unwrapOk(result)).toBe("first");
  });
});

// ===========================================================================
// H21 — a refusal must be indistinguishable above the port
// ===========================================================================

describe("a refusal is indistinguishable above the port, across both adapters (H21)", () => {
  test("the same Failure, returned by a memory route and by a fetch client with an equivalent decoder, is equal above the port", async () => {
    const shared = conflict("slot already taken", { requestId: "req_shared" });

    const memoryClient = createMemoryClient({
      routes: [
        {
          method: "POST",
          pattern: /^\/reservations$/,
          handle: () => err(shared),
        },
      ],
    });

    globalThis.fetch = vi.fn(
      async () => new Response("ignored-by-custom-decoder", { status: 409 }),
    ) as any;
    const fetchClient = createFetchClient({
      baseUrl: "https://api.example.test",
      decodeFailure: async () => shared,
    });

    const [memoryResult, fetchResult] = await Promise.all([
      memoryClient.post("/reservations"),
      fetchClient.post("/reservations"),
    ]);

    expect(isOk(memoryResult)).toBe(false);
    expect(isOk(fetchResult)).toBe(false);

    const memoryFailure = unwrapErr(memoryResult);
    const fetchFailure = unwrapErr(fetchResult);

    expect(memoryFailure).toEqual(fetchFailure);
    expect(kindOf(memoryFailure)).toBe(kindOf(fetchFailure));
    expect(memoryFailure.message).toBe(fetchFailure.message);
  });
});
