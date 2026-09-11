import {
  canceled,
  conflict,
  err,
  forbidden,
  internal,
  invalid,
  notFound,
  ok,
  rateLimited,
  timeout,
  unauthenticated,
  unavailable,
  type Failure,
  type FailureKind,
  type Result,
} from "../kernel";
import type { HttpClient, RequestOptions } from "../http";
import { effectFor, isActive, rng, type Plan } from "./plan";

/* A DECORATOR over the port, not an interceptor.
 *
 * Because the port returns Result, breaking things is just returning a
 * different value — no patched fetch, no knowledge of HTTP, and nothing above
 * this changes. Services, screens and the cache cannot tell.
 *
 * It sits ABOVE the transport, so the failures it produces are UNNARROWED: a
 * forced `invalid` on a read is folded to `internal` by that read's own
 * narrowing, with the original as its cause. That is the real path, not a
 * simulation of it.
 *
 * It is NOT a fixture. A fixture reproduces what the server does; chaos forces
 * what it could. Keeping them apart is what stops "a fixture must reproduce
 * refusals" from decaying into "a fixture returns whatever is convenient" —
 * which is why this wraps either adapter and never edits a route table.
 */

const FAILURES: Record<FailureKind, (m: string) => Failure> = {
  unauthenticated,
  forbidden,
  not_found: notFound,
  invalid: (m) => invalid(m, {}),
  conflict,
  rate_limited: (m) => rateLimited(m, 12),
  unavailable,
  timeout,
  canceled,
  internal,
};

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });

/** Wrap a client so a plan can break, empty, slow or hang matching requests.
 *
 *  A NO-OP in production, structurally: the wrapper is not applied at all, so
 *  the only way a live user meets chaos is a deliberate change to this line.
 *  Belt and braces with the composition root being the only permitted caller. */
export function withChaos(
  client: HttpClient,
  plan: Plan | undefined,
  /** The interaction this client belongs to. A forced failure is manufactured
   *  HERE rather than by an adapter, so nothing else can attach it — and a
   *  failure that cannot name its interaction is the one you most want to
   *  trace. The composition root supplies it. */
  correlationId?: string,
): HttpClient {
  if (process.env.NODE_ENV === "production") return client;
  if (!isActive(plan) || !plan) return client;

  const next = rng(plan.seed ?? 1);

  const request = async <T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<Result<T, Failure>> => {
    const effect = effectFor(plan, method, path);
    if (!effect || (effect.p !== undefined && next() >= effect.p)) {
      return client.request<T>(method, path, options);
    }

    // Order matters and is documented: wait, then hang, then empty, then fail.
    if (effect.latency) await sleep(effect.latency, options.signal);

    if (effect.hang) {
      if (options.signal?.aborted)
        return err(canceled("The request was cancelled."));
      return new Promise<Result<T, Failure>>((resolve) => {
        options.signal?.addEventListener(
          "abort",
          () => resolve(err(canceled("The request was cancelled."))),
          { once: true },
        );
      });
    }

    if (effect.empty) return ok((effect.empty === "list" ? [] : null) as T);
    if (effect.fail) {
      const failure = FAILURES[effect.fail](`Chaos: forced ${effect.fail}.`);
      return err(
        correlationId === undefined ? failure : { ...failure, correlationId },
      );
    }

    return client.request<T>(method, path, options);
  };

  return {
    request,
    get: (p, o) => request("GET", p, o),
    post: (p, o) => request("POST", p, o),
    put: (p, o) => request("PUT", p, o),
    patch: (p, o) => request("PATCH", p, o),
    delete: (p, o) => request("DELETE", p, o),
  };
}
