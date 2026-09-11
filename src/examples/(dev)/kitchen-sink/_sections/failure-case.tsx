import { createSignal, For, onCleanup, onMount } from "solid-js";
import { parsePlan } from "~/lib/chaos";
import type { TransportFailure } from "~/lib/kernel";
import {
  assertNever,
  chain,
  conflict,
  forbidden,
  internal,
  invalid,
  isTransport,
  notFound,
  rateLimited,
  timeout,
  unauthenticated,
  unavailable,
  type Failure,
} from "~/lib/kernel";
import { createRoot } from "~/lib/root";
import { getItem } from "~/lib/services/example";
import { Case, Row } from "../_components/section";
import s from "../_components/sink.module.css";
import { routes } from "../_lib/demo";

/* The two cases the sink was missing: what a failure IS by the time a component
 * sees it, and what a component does with it. */

/* ── 1 · the path ────────────────────────────────────────────────────────── */

const HOPS = [
  ["the wire", "a status and a body — the only place either is named"],
  [
    "envelope",
    "decodes to exactly one Failure. Total: a malformed body still produces one",
  ],
  ["transport", "returns it as a VALUE. Nothing below the screen throws"],
  ["chaos", "may substitute one, in development only"],
  [
    "service",
    "narrows: transport kinds pass through, an unpromised domain kind folds to internal WITH the original as its cause",
  ],
  ["screen", "switches. Transport surface once, its own domain kinds by name"],
] as const;
export function FailurePathCase() {
  const [seen, setSeen] = createSignal<Failure | null>(null);
  onMount(() => {
    const cleanup = (() => {
      void (async () => {
        /* Force a `conflict` on a read. A read promises only `not_found`, so the
           service must fold it — and the fold is the interesting part. */
        const root = createRoot({
          routes,
          chaos: parsePlan("chaos=GET /items/i1=fail:conflict"),
        });
        const r = await getItem(root.clientFor("example"), "i1");
        if (!r.ok) setSeen(r.error);
      })();
    })();
    if (typeof cleanup === "function") onCleanup(cleanup);
  });
  return (
    <Case
      title="How a failure travels"
      note="forced conflict on a read, and what the service does with it"
    >
      <div class={s.hops}>
        {
          <For each={HOPS}>
            {([tier, what], i) => (
              <div class={s.hop}>
                <span class={s.hopTier}>
                  {i() + 1}. {tier}
                </span>
                <span class={s.hopWhat}>{what}</span>
              </div>
            )}
          </For>
        }
      </div>

      {(() => {
        const _seenSnapshot = seen();
        return _seenSnapshot ? (
          <>
            <Row label="screen sees">
              <code class={s.planLine}>
                {_seenSnapshot.kind}
                {_seenSnapshot.status
                  ? ` · status ${_seenSnapshot.status}`
                  : ""}
              </code>
            </Row>
            <Row label="cause chain">
              <code class={s.planLine}>
                {chain(_seenSnapshot)
                  .map((f) => f.kind)
                  .join("  ←  ")}
              </code>
            </Row>
            <Row label="correlation">
              <code class={s.planLine}>
                {_seenSnapshot.correlationId ?? "—"}
              </code>
            </Row>
            <p class={s.limits}>
              A read cannot produce <code>conflict</code>, so the service folded
              it to <code>internal</code> and kept the original as its cause —
              <strong> nothing was lost and the signature stayed true</strong>.
              The correlation id came from the composition root, so this failure
              names the interaction it belonged to even though no server was
              involved.
            </p>
          </>
        ) : (
          <p class={s.quiet}>…</p>
        );
      })()}
    </Case>
  );
}

/* ── 2 · what a component does with one ──────────────────────────────────── */

const SPECIMENS: Failure[] = [
  unauthenticated("Your session expired."),
  forbidden("You cannot see this workspace."),
  rateLimited("Too many requests.", 12),
  unavailable("The server could not be reached."),
  timeout("The server took too long."),
  {
    kind: "canceled",
    message: "You cancelled this.",
  },
  internal("Something went wrong.", {
    requestId: "req_8f2a41",
  }),
  notFound("That item does not exist."),
  invalid("Check the form.", {
    name: "A name is required.",
    host: "Not a hostname.",
  }),
  conflict("Somebody else edited this."),
];

/** The transport surface, written ONCE. Seven kinds, and every screen delegates
 *  to it — because any call can produce one and no service may narrow it away. */
function TransportProblem(props: { failure: TransportFailure }) {
  return (
    <>
      {(() => {
        switch (props.failure.kind) {
          case "unauthenticated":
            return (
              <span class={s.warnText}>
                {props.failure.message} <a href="#">Sign in</a>
              </span>
            );
          // Deliberately not a sign-in prompt: they ARE signed in, and offering one loops.
          case "forbidden":
            return <span class={s.crit}>{props.failure.message}</span>;
          case "rate_limited":
            return (
              <span class={s.warnText}>
                {props.failure.message}
                {props.failure.retryAfter
                  ? ` Try again in ${props.failure.retryAfter}s.`
                  : ""}
              </span>
            );
          case "unavailable":
          case "timeout":
            return (
              <span class={s.warnText}>
                {props.failure.message} Usually temporary.
              </span>
            );
          // An answer, not a failure. They asked for it.
          case "canceled":
            return <span class={s.quiet}>— nothing rendered —</span>;
          case "internal":
            return (
              <span class={s.crit}>
                {props.failure.message}{" "}
                <code class={s.mono}>{props.failure.requestId}</code>
              </span>
            );
          default:
            return assertNever(props.failure, "transport failure");
        }
      })()}
    </>
  );
}
export function FailureRenderingCase() {
  return (
    <Case
      title="Rendering a failure"
      note="the transport surface once; a screen adds only its own domain kinds"
    >
      <For each={SPECIMENS}>
        {(f) => (
          <Row label={f.kind}>
            {isTransport(f) ? (
              <TransportProblem failure={f} />
            ) : f.kind === "invalid" ? (
              // `fields` exists on THIS branch and nowhere else — no optional chaining.
              <span class={s.fieldList}>
                <For each={Object.entries(f.fields)}>
                  {([k, v]) => (
                    <span>
                      <code class={s.mono}>{k}</code> {v}
                    </span>
                  )}
                </For>
              </span>
            ) : f.kind === "not_found" ? (
              <span class={s.quiet}>{f.message}</span>
            ) : (
              <span class={s.warnText}>
                {f.message} Reload to see the current version.
              </span>
            )}
          </Row>
        )}
      </For>

      <p class={s.limits}>
        Ten kinds here because this is the unnarrowed boundary. A read promises
        one domain kind, so its switch is <strong>one case</strong> plus the
        shared transport surface; a create promises two. Writing{" "}
        <code>case &quot;invalid&quot;</code> on a read does not compile, and an
        eleventh kind stops every one of these switches compiling until it is
        handled — which is the point of a closed union.
      </p>
    </Case>
  );
}
