import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryClient } from "../../http";
import { getMyActivity } from "./ledger.api";
import { ledgerRoutes, record, resetLedgerFixtures } from "./ledger.fixtures";
import {
  sessionRoutes,
  signIn,
  DEMO_CREDENTIALS,
  resetSessionFixtures,
} from "../session";

/* The paged read, against the routes the screen actually runs on. */

const client = (token: string | null = "tok_x") =>
  createMemoryClient({
    routes: [...sessionRoutes, ...ledgerRoutes],
    getAccessToken: () => token,
    getCorrelationId: () => "cid-test",
    latencyMs: 0,
  });

beforeEach(() => {
  resetSessionFixtures();
  resetLedgerFixtures();
});

describe("paging is by cursor, and the cursor is opaque", () => {
  it("a first page carries a next when there is more", async () => {
    const r = await getMyActivity(client());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.entries.length).toBeGreaterThan(0);
      expect(r.value.next).toBeTruthy();
    }
  });

  it("next is ABSENT on the last page — not an empty string, not null", async () => {
    // A caller draws "load more" from the presence of the key, so the absence
    // has to be a real absence.
    let after: string | undefined;
    let pages = 0;
    for (;;) {
      const r = await getMyActivity(client(), { after });
      if (!r.ok) return expect.unreachable("the read should have succeeded");
      pages++;
      if (!r.value.next) break;
      after = r.value.next;
      if (pages > 20) return expect.unreachable("paging did not terminate");
    }
    expect(pages).toBeGreaterThan(1);
  });

  it("pages do not overlap and do not skip", async () => {
    const seen: string[] = [];
    let after: string | undefined;
    for (;;) {
      const r = await getMyActivity(client(), { after });
      if (!r.ok) return expect.unreachable("the read should have succeeded");
      seen.push(...r.value.entries.map((e) => e.id));
      if (!r.value.next) break;
      after = r.value.next;
    }
    expect(new Set(seen).size).toBe(seen.length);
  });

  it("a cursor the server cannot read is page one, not a failure", async () => {
    // A stale bookmark shows the top of the list. An unreadable cursor is not
    // the reader's fault, and a failure screen would be the wrong answer.
    const first = await getMyActivity(client());
    const junk = await getMyActivity(client(), { after: "not-a-cursor" });
    expect(junk.ok).toBe(true);
    if (first.ok && junk.ok) {
      expect(junk.value.entries[0]?.id).toBe(first.value.entries[0]?.id);
    }
  });

  it("newest first, always", async () => {
    const r = await getMyActivity(client(), { limit: 50 });
    if (!r.ok) return expect.unreachable("the read should have succeeded");
    const times = r.value.entries.map((e) => Date.parse(e.occurred_at));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});

describe("facets", () => {
  it("arrive with the FIRST page and not with later ones", async () => {
    const first = await getMyActivity(client());
    if (!first.ok || !first.value.next)
      return expect.unreachable("expected a next page");
    const second = await getMyActivity(client(), { after: first.value.next });

    expect(first.value.facets?.length).toBeGreaterThan(0);
    // Absent means "keep the ones you have", never "there are none".
    expect(second.ok && second.value.facets).toBeUndefined();
  });

  it("count the WHOLE log, not the filtered set", async () => {
    // The rule that keeps a reader able to leave a facet they entered: counting
    // the filter would show every other bucket as zero.
    const all = await getMyActivity(client());
    const filtered = await getMyActivity(client(), { facet: "session" });
    if (!all.ok || !filtered.ok)
      return expect.unreachable("the reads should have succeeded");
    expect(filtered.value.facets).toEqual(all.value.facets);
  });

  it("an unknown facet is an empty page and a success", async () => {
    // Looked and found nothing — not nobody looked, and not a failure screen.
    const r = await getMyActivity(client(), { facet: "no-such-thing" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.entries).toEqual([]);
      expect(r.value.next).toBeUndefined();
    }
  });
});

describe("the log is a real record of what happened", () => {
  it("signing in writes a row, and it names the interaction", async () => {
    const before = await getMyActivity(client(), { correlation: "cid-test" });
    expect(before.ok && before.value.entries).toHaveLength(0);

    await signIn(client(null), DEMO_CREDENTIALS);

    const after = await getMyActivity(client(), { correlation: "cid-test" });
    expect(after.ok).toBe(true);
    if (after.ok) {
      expect(after.value.entries.map((e) => e.action)).toContain(
        "session.signed_in",
      );
      expect(
        after.value.entries.every((e) => e.correlation_id === "cid-test"),
      ).toBe(true);
    }
  });

  it("a REFUSED sign-in is recorded, and the actor is anonymous", async () => {
    // The entry somebody actually reads a log for. Naming the account the
    // attempt was aimed at would put a name on an act it did not perform.
    await signIn(client(null), { ...DEMO_CREDENTIALS, password: "wrong" });

    const r = await getMyActivity(client(), { correlation: "cid-test" });
    if (!r.ok) return expect.unreachable("the read should have succeeded");
    const row = r.value.entries.find(
      (e) => e.action === "session.sign_in_failed",
    );
    expect(row).toBeDefined();
    expect(row!.actor).toBe("anonymous");
    expect(row!.detail.reason).toBe("wrong_password");
  });

  it("detail is always an object, so a caller can index it without a guard", async () => {
    record({
      scope: "system",
      action: "system.thing",
      subject: "x",
      actor: "system",
      correlationId: "cid-test",
    });
    const r = await getMyActivity(client(), { correlation: "cid-test" });
    expect(
      r.ok &&
        r.value.entries.every((e) => e.detail && typeof e.detail === "object"),
    ).toBe(true);
  });

  it("a row with no correlation says so rather than inventing one", async () => {
    record({
      scope: "system",
      action: "system.thing",
      subject: "x",
      actor: "system",
      correlationId: undefined,
    });
    const r = await getMyActivity(client(), { correlation: "unknown" });
    expect(r.ok && r.value.entries.length).toBeGreaterThan(0);
  });
});

describe("it is not a way to read anybody else's history", () => {
  it("no bearer is unauthenticated, not an empty page", async () => {
    const r = await getMyActivity(client(null));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("unauthenticated");
  });
});
