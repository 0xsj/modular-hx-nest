/* Implementation-derived smoke tests.
 *
 * NOT the spec suite. These were written alongside the implementation, so by
 * `protocols/spec-tests.md` they are a snapshot: they pass on day one and
 * inherit any existing bug as an expectation. They are here as a regression net
 * while the barriered suite is written — see
 * `decisions/0001-spec-tests-start-at-business-logic`.
 *
 * What they DO carry that a snapshot usually cannot: three of these assertions
 * pin defects that were real in an earlier draft and were measured, not
 * imagined — a timeout classified as a cancellation, `optional` absorbing an
 * unserved route as emptiness, and narrowing folding a transport kind and
 * destroying its retry-after. */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  all,
  asFailure,
  because,
  canceled,
  chain,
  conflict,
  DOMAIN_KINDS,
  err,
  FAILURE_KINDS,
  internal,
  invalid,
  isTransport,
  narrow,
  notFound,
  ok,
  optional,
  absentWhenType,
  anyNotFound,
  presenceOf,
  rateLimited,
  retryDelay,
  timeout,
  TRANSPORT_KINDS,
  unauthenticated,
  unwrap,
  type Failure,
  type Fails,
  type Result,
  type TransportFailure,
} from "../kernel";
import {
  createFetchClient,
  createMemoryClient,
  failureFromTransport,
  requireToken,
  UNSERVED_ROUTE,
  type MemoryRoute,
} from ".";
import type { HttpClient } from ".";

/* A minimal service, defined HERE rather than imported, so this suite ships
 * with `lib` and does not depend on an example domain that a clone will delete.
 * It is the smallest thing that still exercises `narrow` and `optional`. */

type Target = { id: string; name: string; host: string };
type NewTarget = { name: string; host: string };

type ReadFailure = TransportFailure | Fails<"not_found">;
type CreateFailure = TransportFailure | Fails<"invalid" | "conflict">;

const asReadFailure = narrow("not_found");
const asCreateFailure = narrow("invalid", "conflict");

const getTarget = async (
  c: HttpClient,
  id: string,
): Promise<Result<Target, ReadFailure>> =>
  (await c.get<Target>(`/targets/${id}`)).mapErr(asReadFailure);

const listTargets = async (
  c: HttpClient,
  workspace: string,
): Promise<Result<Target[], ReadFailure>> =>
  (await c.get<Target[]>("/targets", { params: { workspace } })).mapErr(
    asReadFailure,
  );

const findPrimaryTarget = async (
  c: HttpClient,
  workspace: string,
): Promise<Result<Target | null, TransportFailure>> =>
  optional(
    (await c.get<Target>(`/workspaces/${workspace}/primary-target`)).mapErr(
      asReadFailure,
    ),
    absentWhenType("no_primary_target"),
  );

const createTarget = async (
  c: HttpClient,
  input: NewTarget,
): Promise<Result<Target, CreateFailure>> => {
  const fields: Record<string, string> = {};
  if (!input.name.trim()) fields.name = "A name is required.";
  if (!/^[a-z0-9.-]+$/i.test(input.host))
    fields.host = "That is not a hostname.";
  if (Object.keys(fields).length)
    return err(invalid("Check the form.", fields));
  return (await c.post<Target>("/targets", { body: input })).mapErr(
    asCreateFailure,
  );
};

const targetPage = async (
  c: HttpClient,
  workspace: string,
  id: string,
): Promise<Result<{ target: Target; siblings: Target[] }, ReadFailure>> => {
  const [target, siblings] = await Promise.all([
    getTarget(c, id),
    listTargets(c, workspace),
  ]);
  return all([target, siblings]).map(([t, s]) => ({ target: t, siblings: s }));
};

const TARGET: Target = { id: "t1", name: "api", host: "api.example.com" };

const routes: MemoryRoute[] = [
  {
    method: "GET",
    pattern: /^\/targets$/,
    handle: (req) => {
      const t = requireToken(req);
      return t.ok ? ok([TARGET]) : t;
    },
  },
  { method: "GET", pattern: /^\/targets\/t1$/, handle: () => ok(TARGET) },
  {
    method: "GET",
    pattern: /^\/targets\/gone$/,
    handle: () => err(notFound("No such target", { status: 404 })),
  },
  {
    method: "GET",
    pattern: /^\/targets\/busy$/,
    handle: () => err(rateLimited("Slow down", 30, { status: 429 })),
  },
  {
    method: "GET",
    pattern: /^\/targets\/moved$/,
    handle: () => err(conflict("State moved", { status: 409 })),
  },
  {
    method: "GET",
    pattern: /^\/workspaces\/none\/primary-target$/,
    handle: () =>
      err(notFound("none set", { status: 404, type: "no_primary_target" })),
  },
  {
    method: "GET",
    pattern: /^\/workspaces\/set\/primary-target$/,
    handle: () => ok(TARGET),
  },
  {
    method: "GET",
    pattern: /^\/workspaces\/typo\/primary-target$/,
    handle: () =>
      err(
        notFound("Cannot GET /workspaces/typo/primary-targe", { status: 404 }),
      ),
  },
  {
    method: "GET",
    pattern: /^\/workspaces\/guarded\/primary-target$/,
    handle: (req) => {
      const t = requireToken(req);
      return t.ok ? ok(TARGET) : t;
    },
  },
];

const client = createMemoryClient({
  routes,
  latencyMs: 0,
  getAccessToken: () => "tok",
});
const anon = createMemoryClient({ routes, latencyMs: 0 });

describe("1 · the split", () => {
  it("partitions the ten kinds exactly", () => {
    expect(TRANSPORT_KINDS.length + DOMAIN_KINDS.length).toBe(
      FAILURE_KINDS.length,
    );
    expect(new Set(FAILURE_KINDS).size).toBe(10);
  });

  it("narrow passes every transport kind through untouched", () => {
    const asRead = narrow("not_found");
    for (const f of [
      unauthenticated("a"),
      rateLimited("b", 30),
      canceled("c"),
      timeout("d"),
    ]) {
      expect(asRead(f)).toBe(f);
    }
  });

  it("narrow keeps the promised domain kind and folds the rest with cause", () => {
    const asRead = narrow("not_found");
    const kept = asRead(notFound("x"));
    expect(kept.kind).toBe("not_found");
    const folded = asRead(conflict("moved", { status: 409, requestId: "r1" }));
    expect(folded.kind).toBe("internal");
    expect(folded.status).toBe(409);
    expect(folded.requestId).toBe("r1");
    expect(chain(folded).map((f) => f.kind)).toEqual(["internal", "conflict"]);
  });

  it("v2's defect: a rate-limited read keeps the server's retry-after", async () => {
    const r = await getTarget(client, "busy");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.kind).toBe("rate_limited");
    expect(retryDelay(r.error, 0)).toBe(30_000);
  });

  it("v2's defect: a cancellation is never rewritten as an error", () => {
    const asCreate = narrow("invalid", "conflict");
    expect(asCreate(canceled("navigated away")).kind).toBe("canceled");
  });

  it("an unexpected domain kind on a read is a contract break, not a not_found", async () => {
    const r = await getTarget(client, "moved");
    if (r.ok) throw new Error("expected failure");
    expect(r.error.kind).toBe("internal");
    expect(r.error.cause?.kind).toBe("conflict");
  });

  it("isTransport lets a screen delegate and switch only over domain kinds", () => {
    const describeRead = (f: TransportFailure | Fails<"not_found">): string => {
      if (isTransport(f)) return `transport:${f.kind}`;
      switch (f.kind) {
        case "not_found":
          return "gone";
        // `default: assertNever(f)` would hold here; a `case "invalid"` would not compile.
      }
    };
    expect(describeRead(timeout("t"))).toBe("transport:timeout");
    expect(describeRead(notFound("n"))).toBe("gone");
  });
});

describe("2 · constructors keep their precision, both ways", () => {
  it("a failure constructor returns its exact variant", () => {
    const kind: "not_found" = notFound("x").kind;
    expect(kind).toBe("not_found");
  });
  it("ok() returns Ok, so .value needs no narrowing — v2 lost this", () => {
    expect(ok(1).value).toBe(1);
    expect(err(timeout("t")).error.kind).toBe("timeout");
  });
});

describe("3 · three states, with absence named by the service", () => {
  it("looked and found nothing is a SUCCESS with null", async () => {
    const r = await findPrimaryTarget(client, "none");
    expect(r.ok && r.value).toBeNull();
    expect(presenceOf(r).state).toBe("empty");
  });
  it("found is found", async () => {
    expect(presenceOf(await findPrimaryTarget(client, "set")).state).toBe(
      "found",
    );
  });
  it("nobody looked is a failure, and a different one", async () => {
    const r = await findPrimaryTarget(anon, "guarded");
    if (r.ok) throw new Error("expected failure");
    expect(r.error.kind).toBe("unauthenticated");
    expect(presenceOf(r).state).toBe("unmeasured");
  });
  it("v2's defect: a 404 the service does not recognise is NOT absence", async () => {
    const r = await findPrimaryTarget(client, "typo");
    if (r.ok) throw new Error("expected failure");
    expect(r.error.kind).toBe("internal");
    expect(r.error.cause?.kind).toBe("not_found");
    expect(presenceOf(r).state).toBe("unmeasured");
  });
  it("v2's defect: an unserved fixture route is unmeasured, never empty", async () => {
    const r = await findPrimaryTarget(
      createMemoryClient({ routes: [], latencyMs: 0 }),
      "anything",
    );
    if (r.ok) throw new Error("expected failure");
    expect(r.error.kind).toBe("internal");
    expect(r.error.type).toBe(UNSERVED_ROUTE);
    expect(presenceOf(r).state).toBe("unmeasured");
  });
  it("all three states are distinct", async () => {
    const states = (
      await Promise.all([
        findPrimaryTarget(client, "none"),
        findPrimaryTarget(client, "set"),
        findPrimaryTarget(anon, "guarded"),
      ])
    ).map((r) => presenceOf(r).state);
    expect(new Set(states).size).toBe(3);
  });
  it("anyNotFound is the weak choice and does what it says", async () => {
    const r = await optional(
      err<Target, Failure>(notFound("whatever")),
      anyNotFound,
    );
    expect(r.ok && r.value).toBeNull();
    const typed = await optional(
      err<Target, Failure>(notFound("whatever")),
      absentWhenType("no_primary_target"),
    );
    expect(typed.ok).toBe(false);
  });
});

describe("4 · the port returns Result", () => {
  it("a refusal from the fixture has the shape the wire would produce", async () => {
    const r = await listTargets(anon, "w1");
    if (r.ok) throw new Error("expected failure");
    /* AMENDED 2026-09-09, and the reason is the assertion's own title: a wire
       refusal carries a request id, so a fixture that minted none was the thing
       failing to reproduce the wire. See custody/evidence/0001/06-amendments.md. */
    const { requestId, ...rest } = r.error;
    expect(requestId).toMatch(/^req_/);
    expect(rest).toEqual({
      kind: "unauthenticated",
      message: "Sign in to continue.",
      status: 401,
    });
  });
  it("fields exist on invalid and are typed there", async () => {
    const r = await createTarget(client, { name: "", host: "!!" });
    if (r.ok || r.error.kind !== "invalid") throw new Error("expected invalid");
    expect(r.error.fields).toEqual({
      name: "A name is required.",
      host: "That is not a hostname.",
    });
  });
  it("all preserves the tuple, returns the first failure, reads left to right", async () => {
    const page = await targetPage(client, "w1", "t1");
    expect(page.ok && page.value).toEqual({
      target: TARGET,
      siblings: [TARGET],
    });
    const bad = all([
      ok(1),
      err<number>(timeout("a")),
      err<number>(internal("b")),
    ]);
    expect(!bad.ok && bad.error.kind).toBe("timeout");
  });
});

describe("5 · the fetch client and the envelope", () => {
  afterEach(() => vi.unstubAllGlobals());

  const respond = (
    status: number,
    body: unknown,
    headers: Record<string, string> = {},
  ) =>
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(typeof body === "string" ? body : JSON.stringify(body), {
          status,
          headers: { "content-type": "application/json", ...headers },
        }),
    );
  const http = (extra = {}) =>
    createFetchClient({ baseUrl: "https://api.test/", ...extra });

  it("a problem document's kind wins over the status", async () => {
    respond(400, {
      kind: "conflict",
      message: "Version mismatch",
      request_id: "req-9",
    });
    const r = await http().get("/x");
    if (r.ok) throw new Error("expected failure");
    expect(r.error).toMatchObject({
      kind: "conflict",
      message: "Version mismatch",
      requestId: "req-9",
      status: 400,
    });
  });
  it("without a kind, the status decides, and an RFC 9457 body still yields a message", async () => {
    respond(422, {
      title: "Unprocessable",
      detail: "host is malformed",
      errors: {},
    });
    const r = await http().get("/x");
    if (r.ok) throw new Error("expected failure");
    expect(r.error.kind).toBe("invalid");
    expect(r.error.message).toBe("host is malformed");
  });
  it("an unrecognised server kind is preserved in `type`, not discarded", async () => {
    respond(403, { kind: "seat_limit_reached", message: "No seats left" });
    const r = await http().get("/x");
    if (r.ok) throw new Error("expected failure");
    expect(r.error.kind).toBe("forbidden");
    expect(r.error.type).toBe("seat_limit_reached");
  });
  it("retry-after is read from the header when the body has none", async () => {
    respond(429, "", { "retry-after": "12" });
    const r = await http().get("/x");
    if (r.ok || r.error.kind !== "rate_limited")
      throw new Error("expected rate_limited");
    expect(r.error.retryAfter).toBe(12);
    expect(retryDelay(r.error, 0)).toBe(12_000);
  });
  it("a custom decoder replaces the envelope and nothing else changes", async () => {
    respond(500, { error: { code: "E_TEAPOT", msg: "short and stout" } });
    const r = await http({
      decodeFailure: async (res: Response) => {
        const body = (await res.json()) as {
          error: { code: string; msg: string };
        };
        return unauthenticated(body.error.msg, {
          type: body.error.code,
          status: res.status,
        });
      },
    }).get("/x");
    if (r.ok) throw new Error("expected failure");
    expect(r.error).toMatchObject({
      kind: "unauthenticated",
      type: "E_TEAPOT",
      status: 500,
    });
  });
  it("a non-JSON 200 is internal, not unavailable — a contract break is not retryable", async () => {
    respond(200, "<html>not json</html>");
    const r = await http().get("/x");
    if (r.ok) throw new Error("expected failure");
    expect(r.error.kind).toBe("internal");
    expect(retryDelay(r.error, 0)).toBeNull();
  });
  it("v1's defect: a timeout is `timeout`, not `canceled`", async () => {
    vi.stubGlobal(
      "fetch",
      (_: string, init: RequestInit) =>
        new Promise((_resolve, reject) =>
          init.signal!.addEventListener("abort", () =>
            reject(init.signal!.reason),
          ),
        ),
    );
    const r = await http({ timeoutMs: 5 }).get("/slow");
    if (r.ok) throw new Error("expected failure");
    expect(r.error.kind).toBe("timeout");
    expect(retryDelay(r.error, 0)).toBe(250);
  });
  it("the caller's abort is `canceled`, matched by name so jsdom cannot break it", async () => {
    vi.stubGlobal(
      "fetch",
      (_: string, init: RequestInit) =>
        new Promise((_resolve, reject) =>
          init.signal!.addEventListener("abort", () =>
            reject(init.signal!.reason),
          ),
        ),
    );
    const ac = new AbortController();
    const pending = http().get("/x", { signal: ac.signal });
    ac.abort();
    const r = await pending;
    expect(!r.ok && r.error.kind).toBe("canceled");
    expect(failureFromTransport({ name: "AbortError" }).kind).toBe("canceled");
    expect(failureFromTransport(new Error("ECONNREFUSED")).kind).toBe(
      "unavailable",
    );
  });
});

describe("6 · the one throw site", () => {
  it("unwrap throws an AppError and asFailure recovers it, totally", async () => {
    const r = await listTargets(anon, "w1");
    try {
      unwrap(r);
      throw new Error("unreachable");
    } catch (e) {
      expect(asFailure(e).kind).toBe("unauthenticated");
    }
    expect(asFailure(new TypeError("bad")).type).toBe("TypeError");
    expect(asFailure(undefined).kind).toBe("internal");
  });
  it("a failure with its cause chain round-trips through JSON", async () => {
    const f = because(internal("outer"), timeout("inner"));
    const wire = JSON.parse(JSON.stringify(f)) as Failure;
    expect(wire).toEqual(f);
    expect(chain(wire).map((x) => x.kind)).toEqual(["internal", "timeout"]);
  });
  it("a Result serialised by accident degrades to plain data, not {}", () => {
    expect(JSON.parse(JSON.stringify(ok(TARGET)))).toEqual({
      ok: true,
      value: TARGET,
    });
  });
});

export const _unused: Result<number> = ok(1);
export const _inv = invalid;
