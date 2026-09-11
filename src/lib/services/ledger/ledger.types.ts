import type { CallOptions } from "../../http";

/** Where an entry sits. Deliberately three, and deliberately not more: a scope
 *  a product cannot enforce in its database is a scope its audit log will
 *  eventually lie about. */
export type AuditScope = "system" | "account" | "session";

export type AuditEntry = {
  id: string;
  scope: AuditScope;
  /** Dotted, domain first — `session.signed_in`, `account.created`. The first
   *  segment is the facet, which is why the shape of the string matters. */
  action: string;
  subject: string;
  /** `anonymous` on a registration, and that is CORRECT: the request arrives
   *  unauthenticated, so the row says so rather than back-filling the account
   *  it went on to create. Render it as "not signed in" — never blank, and
   *  never the account's own name. */
  actor: string;
  /** The interaction this entry belonged to. The whole reason `decisions/0003`
   *  distinguishes a correlation id from a request id: this column is what
   *  makes "what else happened when they did that" answerable. */
  correlation_id: string;
  /** Always an object, never null. `{}` where there is nothing, so a caller can
   *  index it without a guard on every row. */
  detail: Record<string, unknown>;
  occurred_at: string;
};

/** A page of the ledger.
 *
 *  # `next` is ABSENT when there is no more
 *
 *  Which is how a caller decides whether to draw "load more". It is opaque —
 *  its internals belong to the server and will change — and it goes back as
 *  `?after=`.
 *
 *  # There is no total, and there will not be one
 *
 *  Counting an append-only ledger is a full scan whose answer is stale before
 *  it renders. `CLAUDE.md` says an unmeasured total renders as `–` and never as
 *  a number nothing computed, so there is no "showing 1–50 of 1,284".
 *
 *  And no page numbers: the ledger grows at the HEAD, so offset pagination
 *  silently re-shows rows above page one and hides rows below it. A cursor is
 *  not a nicety here, it is the only correct answer.
 *
 *  # `facets` arrives with the FIRST page only
 *
 *  Two rules that are easy to get wrong, and both are about not trapping a
 *  reader:
 *
 *  **The counts ignore the facet filter, on purpose.** Filter to `session` and
 *  every other facet keeps its real count — which is what lets a reader leave a
 *  facet they have entered. Counting the filtered set would show every other
 *  bucket as zero, and a UI that hides empty facets would then remove the way
 *  back. Render this AS GIVEN; never recompute it from the visible rows.
 *
 *  **It describes the whole set, so it does not change as you page**, and it is
 *  absent once `after` is supplied. Absent means *keep the ones you have*,
 *  never *there are no facets*. */
export type AuditPage = {
  entries: AuditEntry[];
  next?: string;
  facets?: Array<{ facet: string; total: number }>;
};

export type PageOptions = CallOptions & {
  /** The opaque cursor from a previous page's `next`. */
  after?: string;
  limit?: number;
  /** An action's FIRST segment. An unknown one is an empty page and a 200, not
   *  an error — so a stale bookmark shows nothing rather than a failure screen,
   *  and "looked and found nothing" stays a different fact from "nobody
   *  looked". */
  facet?: string;
  /** Everything that belonged to one interaction. The column made useful. */
  correlation?: string;
};
