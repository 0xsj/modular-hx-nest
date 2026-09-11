import { narrow, type Result, type TransportFailure } from "../../kernel";
import type { HttpClient } from "../../http";
import type { AuditPage, PageOptions } from "./ledger.types";
import { decodeAuditPage } from "./ledger.responses";

/* Takes the client, never imports one.
 *
 * # It promises no domain kind at all
 *
 * There is nothing here a caller could usefully branch on. An unknown facet is
 * an empty page, not a `not_found`; a cursor from an older shape is an empty
 * page, not an `invalid`. Both are answers, and a read whose emptiness is a
 * legitimate answer must not report it as a failure — so the only kinds this
 * can produce are transport ones, and anything else folds to `internal` with
 * its cause preserved. */

const asTransport = narrow<never>();

/** The caller's own history. Takes no id, because it is not a way to read
 *  anybody else's. */
export async function getMyActivity(
  client: HttpClient,
  options?: PageOptions,
): Promise<Result<AuditPage, TransportFailure>> {
  return (
    await client.get<unknown>("/me/activity", {
      /* `undefined` values are dropped by the port rather than sent as the string
       "undefined", so a first page and a filtered page are the same call. */
      params: {
        after: options?.after,
        limit: options?.limit,
        facet: options?.facet,
        correlation: options?.correlation,
      },
      signal: options?.signal,
      trace: options?.trace,
    })
  )
    .andThen((value) => decodeAuditPage(value, options?.trace))
    .mapErr(asTransport);
}
