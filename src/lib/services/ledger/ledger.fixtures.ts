import {
  err,
  ok,
  unauthenticated,
  type Failure,
  type Result,
} from "../../kernel";
import { requireToken, type MemoryRoute } from "../../http";
import type { AuditEntry, AuditPage, AuditScope } from "./ledger.types";

/* An append-only log that the OTHER fixtures write to.
 *
 * That is the arrangement worth copying: an audit entry is a side effect of an
 * operation, written by the server as part of doing it. So the session routes
 * call `record` and this tier owns the log — the dependency runs one way, and
 * nothing in the ledger knows what a session is.
 *
 * The consequence is that this screen shows a real record of what the fixture
 * actually did. Sign in and a row appears; revoke a session and another does.
 * A static list of invented rows would demonstrate a table; this demonstrates
 * the correlation id, which is the point.
 *
 * Process-lifetime, like everything else here: a Map in a module, gone on a
 * restart, replaced wholesale the day a product has a real endpoint. */

/** Newest first, always. The ledger grows at the head, which is also why a
 *  cursor is the only correct pagination — see `ledger.types.ts`. */
const entries: AuditEntry[] = [];

const newId = (): string =>
  `evt_${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10)}`;

export type RecordInput = {
  scope: AuditScope;
  action: string;
  subject: string;
  actor: string;
  correlationId: string | undefined;
  detail?: Record<string, unknown>;
  occurredAt?: number;
};

/** Called by whatever performed the act. Never by a screen. */
export function record(input: RecordInput): void {
  entries.unshift({
    id: newId(),
    scope: input.scope,
    action: input.action,
    subject: input.subject,
    actor: input.actor,
    /* A row with no correlation is a row that cannot be joined to anything. The
       fallback is honest about that rather than inventing a plausible id. */
    correlation_id: input.correlationId ?? "unknown",
    detail: input.detail ?? {},
    occurred_at: new Date(input.occurredAt ?? Date.now()).toISOString(),
  });
}

/* Enough history that the first page is a page. Deterministic in shape and
   spread over a few days, so ordering, paging and facets are all visible
   before the reader has done anything. */
const SEED: ReadonlyArray<
  Omit<RecordInput, "correlationId"> & {
    correlationId: string;
    agoMinutes: number;
  }
> = [
  {
    scope: "account",
    action: "account.created",
    subject: "ada@example.com",
    actor: "anonymous",
    correlationId: "cid-seed-01",
    detail: { via: "sign-up" },
    agoMinutes: 60 * 74,
  },
  {
    scope: "session",
    action: "session.signed_in",
    subject: "ada@example.com",
    actor: "ada@example.com",
    correlationId: "cid-seed-01",
    detail: { device: "MacBook Pro" },
    agoMinutes: 60 * 74,
  },
  {
    scope: "account",
    action: "account.email_verified",
    subject: "ada@example.com",
    actor: "ada@example.com",
    correlationId: "cid-seed-02",
    detail: {},
    agoMinutes: 60 * 72,
  },
  {
    scope: "session",
    action: "session.signed_out",
    subject: "ada@example.com",
    actor: "ada@example.com",
    correlationId: "cid-seed-03",
    detail: {},
    agoMinutes: 60 * 71,
  },
  {
    scope: "session",
    action: "session.sign_in_failed",
    subject: "ada@example.com",
    actor: "anonymous",
    correlationId: "cid-seed-04",
    detail: { reason: "wrong_password", attempt: 1 },
    agoMinutes: 60 * 50,
  },
  {
    scope: "session",
    action: "session.sign_in_failed",
    subject: "ada@example.com",
    actor: "anonymous",
    correlationId: "cid-seed-04",
    detail: { reason: "wrong_password", attempt: 2 },
    agoMinutes: 60 * 50,
  },
  {
    scope: "session",
    action: "session.signed_in",
    subject: "ada@example.com",
    actor: "ada@example.com",
    correlationId: "cid-seed-05",
    detail: { device: "iPhone" },
    agoMinutes: 60 * 49,
  },
  {
    scope: "account",
    action: "account.password_changed",
    subject: "ada@example.com",
    actor: "ada@example.com",
    correlationId: "cid-seed-06",
    detail: {},
    agoMinutes: 60 * 30,
  },
  {
    scope: "session",
    action: "session.revoked",
    subject: "ses_older",
    actor: "ada@example.com",
    correlationId: "cid-seed-06",
    detail: { device: "iPhone" },
    agoMinutes: 60 * 30,
  },
  {
    scope: "system",
    action: "system.rate_limit_applied",
    subject: "ada@example.com",
    actor: "system",
    correlationId: "cid-seed-07",
    detail: { window: "30s", endpoint: "POST /auth/sign-in" },
    agoMinutes: 60 * 26,
  },
  {
    scope: "system",
    action: "system.fixture_seeded",
    subject: "flover",
    actor: "system",
    correlationId: "cid-seed-08",
    detail: { note: "the memory adapter started" },
    agoMinutes: 60 * 24,
  },
  {
    scope: "session",
    action: "session.expired",
    subject: "ses_stale",
    actor: "system",
    correlationId: "cid-seed-09",
    detail: { ttl_minutes: 30 },
    agoMinutes: 60 * 6,
  },
  {
    scope: "account",
    action: "account.profile_updated",
    subject: "ada@example.com",
    actor: "ada@example.com",
    correlationId: "cid-seed-10",
    detail: { fields: ["name"] },
    agoMinutes: 60 * 5,
  },
  {
    scope: "session",
    action: "session.signed_in",
    subject: "ada@example.com",
    actor: "ada@example.com",
    correlationId: "cid-seed-11",
    detail: { device: "Firefox on Linux" },
    agoMinutes: 90,
  },
];

/* Seeded on first READ, never at module load.
 *
 * A top-level call is a side effect, and a module with one cannot be
 * tree-shaken — so seeding on import put this whole file, seed rows included,
 * into the browser bundle, because `lib/query` imports the ledger barrel for
 * its query function. Measured in the built chunks, which is the only way that
 * kind of leak is ever noticed.
 *
 * The lazy form is also what `session.fixtures.ts` already does, so the two now
 * agree. */
let seeded = false;

function seed(): void {
  if (seeded) return;
  seeded = true;
  const now = Date.now();
  /* Oldest first into `record`, which unshifts — so the array ends up newest
     first without this function knowing that is the order. */
  for (const entry of [...SEED].sort((a, b) => b.agoMinutes - a.agoMinutes)) {
    record({ ...entry, occurredAt: now - entry.agoMinutes * 60_000 });
  }
}

/** Only for tests, which need a log that does not carry across cases. */
export function resetLedgerFixtures(): void {
  entries.length = 0;
  seeded = false;
  seed();
}

const PAGE_SIZE = 8;
const facetOf = (action: string): string => action.split(".")[0] ?? "other";

/** Opaque to a caller, and it must stay that way: this is an index today and
 *  will be a keyset in a real backend. A screen that parses it is a screen that
 *  breaks the day the server improves. */
const encodeCursor = (index: number): string =>
  Buffer.from(`i:${index}`, "utf8").toString("base64url");

const decodeCursor = (cursor: string | undefined): number => {
  if (!cursor) return 0;
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const n = raw.startsWith("i:") ? Number(raw.slice(2)) : NaN;
    /* A cursor this server does not recognise is page ONE, not an error. A
       stale bookmark should show the top of the list rather than a failure
       screen — an unreadable cursor is not the reader's fault. */
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
};

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v ? v : undefined;

export const ledgerRoutes: MemoryRoute[] = [
  {
    method: "GET",
    pattern: /^\/me\/activity$/,
    /* A log query scans; it is not a keyed read. Slower than the session list
       on purpose, so a screen laid out against it has seen its own skeleton. */
    latencyMs: { min: 220, max: 620 },
    handle: (req): Result<AuditPage, Failure> => {
      seed();
      const token = requireToken(req);
      if (!token.ok)
        return err(unauthenticated("Sign in to continue.", { status: 401 }));

      const params = req.params ?? {};
      const facet = str(params.facet);
      const correlation = str(params.correlation);
      const limit = Math.min(Number(params.limit) || PAGE_SIZE, 50);
      const from = decodeCursor(str(params.after));

      const filtered = entries.filter(
        (e) =>
          (!facet || facetOf(e.action) === facet) &&
          (!correlation || e.correlation_id === correlation),
      );

      const slice = filtered.slice(from, from + limit);
      const nextIndex = from + slice.length;

      const page: AuditPage = { entries: slice };

      /* Absent when there is no more, rather than a `next` that returns
         nothing. A caller draws "load more" from the presence of this key. */
      if (nextIndex < filtered.length) page.next = encodeCursor(nextIndex);

      /* First page only, and counted over the WHOLE log rather than the
         filtered set — which is what lets a reader leave a facet they entered.
         Counting the filter would show every other bucket as zero. */
      if (!params.after) {
        const totals = new Map<string, number>();
        for (const entry of entries) {
          const key = facetOf(entry.action);
          totals.set(key, (totals.get(key) ?? 0) + 1);
        }
        page.facets = [...totals.entries()]
          .map(([f, total]) => ({ facet: f, total }))
          .sort((a, b) => b.total - a.total);
      }

      return ok(page);
    },
  },
];
