import { beforeEach, describe, expect, it } from "vitest";
import {
  chain,
  isRetryable,
  rootCause,
  DOMAIN_KINDS,
  FAILURE_KINDS,
  TRANSPORT_KINDS,
} from "../../kernel";
import { parsePlan, withChaos } from "../../chaos";
import { createMemoryClient } from "../../http";
import {
  currentUser,
  listSessions,
  revokeSession,
  signIn,
  signOut,
  signUp,
} from "./session.api";
import {
  DEMO_CREDENTIALS,
  resetSessionFixtures,
  sessionRoutes,
} from "./session.fixtures";

/* The whole flow, against the adapter a screen will use in memory mode. Nothing
 * here is mocked: these are the routes the app runs on. */

const clientWith = (token: string | null = null) =>
  createMemoryClient({
    routes: sessionRoutes,
    getAccessToken: () => token,
    latencyMs: 0,
  });

beforeEach(resetSessionFixtures);

describe("signing in", () => {
  it("returns a token and a user, and no password", async () => {
    const r = await signIn(clientWith(), DEMO_CREDENTIALS);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.token).toMatch(/^tok_/);
      expect(r.value.user.email).toBe(DEMO_CREDENTIALS.email);
      expect(r.value.user).not.toHaveProperty("password");
    }
  });

  it("wrong password is UNAUTHENTICATED, not a field error", async () => {
    /* The distinction the whole service exists to demonstrate. `invalid` carries
       per-field messages and belongs beside an input; this one does not, and a
       form that puts it on the password field has told the reader which half
       was wrong. */
    const r = await signIn(clientWith(), {
      ...DEMO_CREDENTIALS,
      password: "wrong-one",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.kind).toBe("unauthenticated");
      expect(r.error).not.toHaveProperty("fields");
    }
  });

  it("an unknown account is refused identically to a wrong password", async () => {
    // Two different messages would let anybody enumerate registered addresses.
    const unknown = await signIn(clientWith(), {
      email: "nobody@example.com",
      password: "password",
    });
    const wrong = await signIn(clientWith(), {
      ...DEMO_CREDENTIALS,
      password: "not-it",
    });
    expect(unknown.ok || wrong.ok).toBe(false);
    if (!unknown.ok && !wrong.ok) {
      expect(unknown.error.kind).toBe(wrong.error.kind);
      expect(unknown.error.message).toBe(wrong.error.message);
    }
  });

  it("a malformed form never reaches the transport", async () => {
    // The client-side check produces the shape the server would have produced.
    const r = await signIn(clientWith(), {
      email: "not-an-email",
      password: "",
    });
    expect(r.ok).toBe(false);
    if (!r.ok && r.error.kind === "invalid") {
      expect(r.error.fields.email).toBeTruthy();
      expect(r.error.fields.password).toBeTruthy();
    } else {
      expect.unreachable("expected an invalid failure");
    }
  });

  it("enough wrong guesses and the refusal changes shape, with a retry-after", async () => {
    const client = clientWith();
    for (let i = 0; i < 5; i++) {
      await signIn(client, { ...DEMO_CREDENTIALS, password: "wrong" });
    }
    const r = await signIn(client, DEMO_CREDENTIALS); // even the RIGHT one now
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.kind).toBe("rate_limited");
      expect(r.error.kind === "rate_limited" && r.error.retryAfter).toBe(30);
    }
  });

  it("and a success clears the count", async () => {
    const client = clientWith();
    await signIn(client, { ...DEMO_CREDENTIALS, password: "wrong" });
    expect((await signIn(client, DEMO_CREDENTIALS)).ok).toBe(true);
    await signIn(client, { ...DEMO_CREDENTIALS, password: "wrong" });
    expect((await signIn(client, DEMO_CREDENTIALS)).ok).toBe(true);
  });
});

describe("signing up", () => {
  const fresh = {
    name: "Grace Hopper",
    email: "grace@example.com",
    password: "compiler1",
  };

  it("creates an account and signs it in", async () => {
    const r = await signUp(clientWith(), fresh);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.user.name).toBe("Grace Hopper");
  });

  it("and the account can then sign in — the store outlives the request", async () => {
    await signUp(clientWith(), fresh);
    expect(
      (
        await signIn(clientWith(), {
          email: fresh.email,
          password: fresh.password,
        })
      ).ok,
    ).toBe(true);
  });

  it("a taken email is a CONFLICT, not an invalid field", async () => {
    // The form was well-formed; the world disagreed with it.
    const r = await signUp(clientWith(), {
      ...fresh,
      email: DEMO_CREDENTIALS.email,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("conflict");
  });

  it("a padded, differently-cased email is the SAME account", async () => {
    // Found by this test: the service was checking the raw string and sending
    // the raw string, so a trailing space was refused here as malformed while
    // the server would have matched it. It trims once, and sends what it checked.
    const r = await signUp(clientWith(), {
      ...fresh,
      email: `  ${DEMO_CREDENTIALS.email.toUpperCase()} `,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("conflict");
  });

  it("a short password is refused by the service before the wire", async () => {
    const r = await signUp(clientWith(), { ...fresh, password: "short" });
    expect(r.ok).toBe(false);
    if (!r.ok && r.error.kind === "invalid")
      expect(r.error.fields.password).toBeTruthy();
    else expect.unreachable("expected an invalid failure");
  });
});

describe("the bearer", () => {
  it("no token is unauthenticated rather than empty", async () => {
    const r = await currentUser(clientWith(null));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("unauthenticated");
  });

  it("a token from signing in identifies its user", async () => {
    const session = await signIn(clientWith(), DEMO_CREDENTIALS);
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    const me = await currentUser(clientWith(session.value.token));
    expect(me.ok && me.value.email).toBe(DEMO_CREDENTIALS.email);
  });

  it("an unknown token is unauthenticated, never not_found", async () => {
    // The thing that was not found is the session, and "who are you" has one
    // answer when the answer is nobody.
    const r = await currentUser(clientWith("tok_made-up"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("unauthenticated");
  });

  it("signing out invalidates it on the server", async () => {
    const session = await signIn(clientWith(), DEMO_CREDENTIALS);
    if (!session.ok) return expect.unreachable("sign-in should have succeeded");
    const token = session.value.token;

    expect((await signOut(clientWith(token))).ok).toBe(true);
    const after = await currentUser(clientWith(token));
    expect(after.ok).toBe(false);
  });

  it("signing out with no session still succeeds", async () => {
    // The one operation a caller must never be blocked from completing.
    expect((await signOut(clientWith(null))).ok).toBe(true);
  });
});

describe("everywhere this account is signed in", () => {
  it("lists the current session, and marks it", async () => {
    const session = await signIn(clientWith(), DEMO_CREDENTIALS);
    if (!session.ok) return expect.unreachable("sign-in should have succeeded");

    const list = await listSessions(clientWith(session.value.token));
    expect(list.ok).toBe(true);
    if (list.ok) {
      expect(list.value).toHaveLength(1);
      expect(list.value[0].current).toBe(true);
    }
  });

  it("never returns the token it is describing", async () => {
    // The kind of field that gets added back by somebody debugging.
    const a = await signIn(clientWith(), DEMO_CREDENTIALS);
    const b = await signIn(clientWith(), DEMO_CREDENTIALS);
    if (!a.ok || !b.ok)
      return expect.unreachable("sign-in should have succeeded");

    const list = await listSessions(clientWith(a.value.token));
    expect(list.ok && JSON.stringify(list.value)).not.toContain("tok_");
  });

  it("a second sign-in is a second session, and only one is current", async () => {
    const a = await signIn(clientWith(), DEMO_CREDENTIALS);
    const b = await signIn(clientWith(), DEMO_CREDENTIALS);
    if (!a.ok || !b.ok)
      return expect.unreachable("sign-in should have succeeded");

    const list = await listSessions(clientWith(b.value.token));
    expect(list.ok && list.value).toHaveLength(2);
    expect(list.ok && list.value.filter((s) => s.current)).toHaveLength(1);
  });

  it("signing out removes it from the list", async () => {
    const a = await signIn(clientWith(), DEMO_CREDENTIALS);
    const b = await signIn(clientWith(), DEMO_CREDENTIALS);
    if (!a.ok || !b.ok)
      return expect.unreachable("sign-in should have succeeded");

    await signOut(clientWith(a.value.token));
    const list = await listSessions(clientWith(b.value.token));
    expect(list.ok && list.value).toHaveLength(1);
  });

  it("no bearer is unauthenticated, not an empty list", async () => {
    // "Nobody looked" and "looked and found nothing" are different facts, and
    // this is the tier where they must not be confused.
    const r = await listSessions(clientWith(null));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("unauthenticated");
  });
});

describe("sessions expire, because real ones do", () => {
  /* The most common live-API behaviour a fixture omits, and the one that breaks
   * applications: everything works, then every read is a 401 at once. The ttl is
   * read on every check rather than at module load, so this needs no module
   * juggling — and so a running server picks up a changed one. */
  const withTtl = async (ms: number, run: () => Promise<void>) => {
    const previous = process.env.FLOVER_SESSION_TTL_MS;
    process.env.FLOVER_SESSION_TTL_MS = String(ms);
    try {
      await run();
    } finally {
      if (previous === undefined) delete process.env.FLOVER_SESSION_TTL_MS;
      else process.env.FLOVER_SESSION_TTL_MS = previous;
    }
  };

  it("a token past its ttl is unauthenticated, not not_found", async () => {
    const session = await signIn(clientWith(), DEMO_CREDENTIALS);
    if (!session.ok) return expect.unreachable("sign-in should have succeeded");

    await withTtl(-1, async () => {
      const me = await currentUser(clientWith(session.value.token));
      expect(me.ok).toBe(false);
      if (!me.ok) expect(me.error.kind).toBe("unauthenticated");
    });
  });

  it("and it is gone from the list rather than shown as stale", async () => {
    const stale = await signIn(clientWith(), DEMO_CREDENTIALS);
    if (!stale.ok) return expect.unreachable("sign-in should have succeeded");
    await withTtl(-1, async () => {
      // Reading it once is what sweeps it, exactly as a ttl index would.
      await currentUser(clientWith(stale.value.token));
    });

    const fresh = await signIn(clientWith(), DEMO_CREDENTIALS);
    if (!fresh.ok) return expect.unreachable("sign-in should have succeeded");
    const list = await listSessions(clientWith(fresh.value.token));
    expect(list.ok && list.value).toHaveLength(1);
    expect(list.ok && list.value[0].current).toBe(true);
  });

  it("and the session it swept cannot be used again", async () => {
    const session = await signIn(clientWith(), DEMO_CREDENTIALS);
    if (!session.ok) return expect.unreachable("sign-in should have succeeded");
    await withTtl(-1, async () => {
      await currentUser(clientWith(session.value.token));
    });
    // Back under a normal ttl: the token is not merely hidden, it is gone.
    const after = await currentUser(clientWith(session.value.token));
    expect(after.ok).toBe(false);
  });
});

describe("it behaves like a server", () => {
  it("every failure carries a request id, minted per attempt", async () => {
    // A correlation id names the INTERACTION; a request id names one attempt and
    // differs on a retry. A fixture that mints neither makes the distinction in
    // decisions/0003 invisible until production.
    const a = await currentUser(clientWith(null));
    const b = await currentUser(clientWith(null));
    expect(a.ok || b.ok).toBe(false);
    if (!a.ok && !b.ok) {
      expect(a.error.requestId).toMatch(/^req_/);
      expect(a.error.requestId).not.toBe(b.error.requestId);
    }
  });

  it("a cancellation resolves when it is asked for, not when the request would have finished", async () => {
    const slow = createMemoryClient({
      routes: sessionRoutes,
      getAccessToken: () => null,
      latencyMs: 5_000,
    });
    const controller = new AbortController();
    const started = Date.now();
    const pending = listSessions(slow, { signal: controller.signal });
    controller.abort();

    const r = await pending;
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("canceled");
    // The whole point: holding the work for its full latency after cancelling it
    // is exactly what cancelling was meant to avoid.
    expect(Date.now() - started).toBeLessThan(1_000);
  });
});

describe("the contract holds under every forced kind", () => {
  /* The claim the failures screen renders, asserted rather than displayed.
   *
   * `listSessions` promises `TransportFailure` and no domain kind at all. So:
   * a transport kind must arrive UNCHANGED, and a domain kind must be folded to
   * `internal` with the original preserved — the signature stays true and
   * nothing is lost. Forced through the real chaos decorator, not stubbed. */
  const forced = (kind: string) =>
    withChaos(
      createMemoryClient({
        routes: sessionRoutes,
        getAccessToken: () => "tok_x",
        latencyMs: 0,
      }),
      parsePlan(`?chaos=GET /auth/sessions=fail:${kind}`),
      "cid-test",
    );

  it.each([...TRANSPORT_KINDS])(
    "a transport kind arrives unchanged: %s",
    async (kind) => {
      const r = await listSessions(forced(kind));
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.kind).toBe(kind);
        expect(chain(r.error)).toHaveLength(1); // nothing was folded
      }
    },
  );

  it.each([...DOMAIN_KINDS])(
    "an undeclared domain kind folds, and keeps its cause: %s",
    async (kind) => {
      const r = await listSessions(forced(kind));
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.kind).toBe("internal");
        expect(rootCause(r.error).kind).toBe(kind);
        expect(chain(r.error).length).toBeGreaterThan(1);
      }
    },
  );

  it("every kind still carries the interaction it belonged to", async () => {
    for (const kind of FAILURE_KINDS) {
      const r = await listSessions(forced(kind));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.correlationId, kind).toBe("cid-test");
    }
  });

  it("and the retry policy agrees with the kind, not with a status", async () => {
    const refused = await listSessions(forced("forbidden"));
    const broke = await listSessions(forced("unavailable"));
    expect(!refused.ok && isRetryable(refused.error)).toBe(false);
    expect(!broke.ok && isRetryable(broke.error)).toBe(true);
  });
});

describe("revoking another session", () => {
  const twoSessions = async () => {
    const a = await signIn(clientWith(), DEMO_CREDENTIALS);
    const b = await signIn(clientWith(), DEMO_CREDENTIALS);
    if (!a.ok || !b.ok) throw new Error("sign-in should have succeeded");
    const list = await listSessions(clientWith(b.value.token));
    if (!list.ok) throw new Error("list should have succeeded");
    return { a: a.value, b: b.value, list: list.value };
  };

  it("ends the other one, and the list shrinks", async () => {
    const { a, b, list } = await twoSessions();
    const other = list.find((s) => !s.current)!;

    expect((await revokeSession(clientWith(b.token), other.id)).ok).toBe(true);
    const after = await listSessions(clientWith(b.token));
    expect(after.ok && after.value).toHaveLength(1);
    // And the revoked token is genuinely dead, not merely hidden.
    expect((await currentUser(clientWith(a.token))).ok).toBe(false);
  });

  it("already gone is NOT_FOUND — which means an optimistic removal was right", async () => {
    const { b, list } = await twoSessions();
    const other = list.find((s) => !s.current)!;
    await revokeSession(clientWith(b.token), other.id);

    const again = await revokeSession(clientWith(b.token), other.id);
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error.kind).toBe("not_found");
  });

  it("your own session is a CONFLICT, not a permission problem", async () => {
    // Nothing is being refused on authority: the request contradicts the state
    // it was made from. Signing yourself out is a different operation.
    const { b, list } = await twoSessions();
    const mine = list.find((s) => s.current)!;

    const r = await revokeSession(clientWith(b.token), mine.id);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("conflict");
  });

  it("someone else's session is not_found rather than forbidden", async () => {
    // Telling a caller a session EXISTS but is not theirs is telling them
    // something about another account.
    const { b } = await twoSessions();
    const r = await revokeSession(clientWith(b.token), "ses_someone-else");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("not_found");
  });

  it("no bearer is unauthenticated", async () => {
    const r = await revokeSession(clientWith(null), "ses_whatever");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("unauthenticated");
  });

  it("an undeclared domain kind still folds — the contract holds on writes too", async () => {
    const forced = withChaos(
      createMemoryClient({
        routes: sessionRoutes,
        getAccessToken: () => "tok_x",
        latencyMs: 0,
      }),
      parsePlan("?chaos=DELETE /auth/sessions/ses_1=fail:invalid"),
      "cid-w",
    );
    const r = await revokeSession(forced, "ses_1");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.kind).toBe("internal"); // `invalid` was never promised
      expect(rootCause(r.error).kind).toBe("invalid");
    }
  });
});
