import { For, Show, createResource } from "solid-js";
import {
  assertNever, chain, conflict, forbidden, internal, invalid, isTransport,
  notFound, rateLimited, timeout, unauthenticated, unavailable,
  type Failure, type TransportFailure,
} from "~/lib/kernel";
import { parsePlan } from "~/lib/chaos";
import { createRoot } from "~/lib/root";
import { getItem } from "~/lib/services/example";
import { Case, Row } from "../_components/section";
import { routes } from "../_lib/demo";
import s from "../_components/sink.module.css";

/* The two cases the sink was missing: what a failure IS by the time a component
 * sees it, and what a component does with it. */

const HOPS = [
  ["the wire", "a status and a body — the only place either is named"],
  ["envelope", "decodes to exactly one Failure. Total: a malformed body still produces one"],
  ["transport", "returns it as a VALUE. Nothing below the screen throws"],
  ["chaos", "may substitute one, in development only"],
  ["service", "narrows: transport kinds pass through, an unpromised domain kind folds to internal WITH the original as its cause"],
  ["screen", "switches. Transport surface once, its own domain kinds by name"],
] as const;

export function FailurePathCase() {
  /* Force a `conflict` on a read. A read promises only `not_found`, so the
     service must fold it — and the fold is the interesting part. */
  const [seen] = createResource(async () => {
    const root = createRoot({ routes, chaos: parsePlan("chaos=GET /items/i1=fail:conflict") });
    const result = await getItem(root.client, "i1");
    return result.ok ? null : result.error;
  });

  return (
    <Case title="How a failure travels" note="forced conflict on a read, and what the service does with it">
      <div class={s.hops}>
        <For each={HOPS}>
          {([tier, what], i) => (
            <div class={s.hop}>
              <span class={s.hopTier}>{i() + 1}. {tier}</span>
              <span class={s.hopWhat}>{what}</span>
            </div>
          )}
        </For>
      </div>

      <Show when={seen()} fallback={<p class={s.unread}>…</p>}>
        {(failure) => (
          <>
            <Row label="screen sees">
              <code class={s.mono}>
                {failure().kind}{failure().status ? ` · status ${failure().status}` : ""}
              </code>
            </Row>
            <Row label="cause chain">
              <code class={s.mono}>{chain(failure()).map((f) => f.kind).join("  ←  ")}</code>
            </Row>
            <Row label="correlation">
              <code class={s.mono}>{failure().correlationId ?? "—"}</code>
            </Row>
            <p class={s.caseNote}>
              A read cannot produce <code>conflict</code>, so the service folded it to{" "}
              <code>internal</code> and kept the original as its cause —{" "}
              <strong>nothing was lost and the signature stayed true</strong>. The correlation
              id came from the composition root, so this failure names the interaction it
              belonged to even though no server was involved.
            </p>
          </>
        )}
      </Show>
    </Case>
  );
}

const SPECIMENS: Failure[] = [
  unauthenticated("Your session expired."),
  forbidden("You cannot see this workspace."),
  rateLimited("Too many requests.", 12),
  unavailable("The server could not be reached."),
  timeout("The server took too long."),
  { kind: "canceled", message: "You cancelled this." },
  internal("Something went wrong.", { requestId: "req_8f2a41" }),
  notFound("That item does not exist."),
  invalid("Check the form.", { name: "A name is required.", host: "Not a hostname." }),
  conflict("Somebody else edited this."),
];

/** The transport surface, written ONCE. Seven kinds, and every screen delegates
 *  to it — because any call can produce one and no service may narrow it away. */
function TransportProblem(props: { failure: TransportFailure }) {
  const f = () => props.failure;
  switch (f().kind) {
    case "unauthenticated":
      return <span class={s.warnText}>{f().message} <a href="#forms">Sign in</a></span>;
    /* Deliberately not a sign-in prompt: they ARE signed in, and offering one loops. */
    case "forbidden":
      return <span class={s.fail}>{f().message}</span>;
    case "rate_limited": {
      const after = (f() as { retryAfter?: number }).retryAfter;
      return <span class={s.warnText}>{f().message}{after ? ` Try again in ${after}s.` : ""}</span>;
    }
    case "unavailable":
    case "timeout":
      return <span class={s.warnText}>{f().message} Usually temporary.</span>;
    /* An answer, not a failure. They asked for it. */
    case "canceled":
      return <span class={s.unread}>— nothing rendered —</span>;
    case "internal":
      return <span class={s.fail}>{f().message} <code class={s.mono}>{f().requestId}</code></span>;
    default:
      return assertNever(f() as never, "transport failure");
  }
}

export function FailureRenderingCase() {
  return (
    <Case title="Rendering a failure" note="the transport surface once; a screen adds only its own domain kinds">
      <For each={SPECIMENS}>
        {(f) => (
          <Row label={f.kind}>
            <Show
              when={!isTransport(f)}
              fallback={<TransportProblem failure={f as TransportFailure} />}
            >
              <Show when={f.kind === "invalid"} fallback={
                <Show when={f.kind === "not_found"} fallback={
                  <span class={s.warnText}>{f.message} Reload to see the current version.</span>
                }>
                  <span class={s.unread}>{f.message}</span>
                </Show>
              }>
                {/* `fields` exists on THIS branch and nowhere else — no optional chaining. */}
                <span class={s.rowBody}>
                  <For each={Object.entries((f as { fields: Record<string, string> }).fields)}>
                    {([k, v]) => <span><code class={s.mono}>{k}</code> {v}</span>}
                  </For>
                </span>
              </Show>
            </Show>
          </Row>
        )}
      </For>

      <p class={s.caseNote}>
        Ten kinds here because this is the unnarrowed boundary. A read promises one domain
        kind, so its switch is <strong>one case</strong> plus the shared transport surface; a
        create promises two. Writing <code>case "invalid"</code> on a read does not compile,
        and an eleventh kind stops every one of these switches compiling until it is handled —
        which is the point of a closed union.
      </p>
    </Case>
  );
}
