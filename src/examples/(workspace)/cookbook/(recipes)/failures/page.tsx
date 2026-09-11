import { A as Link } from "@solidjs/router";
import { createMemo, For } from "solid-js";
import {
  Badge,
  Panel,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "~/components/display";
import { Alert } from "~/components/feedback";
import { Container, Flex } from "~/components/layout";
import { toFormState } from "~/lib/app/form-state";
import type { getFailureExample } from "~/lib/app/route-data";
import type { FailureKind } from "~/lib/kernel";
import {
  assertNever,
  chain,
  DOMAIN_KINDS,
  FAILURE_KINDS,
  isRetryable,
  isTransport,
  retryDelay,
  rootCause,
  TRANSPORT_KINDS,
  type Failure,
} from "~/lib/kernel";
import s from "./page.module.css";

/* Every failure kind, forced through the real stack, and rendered exhaustively.
 *
 * Nothing here is simulated at the render. Each link reloads this screen with a
 * chaos plan in the query string; the proxy copies it into a header; the
 * composition root wraps the transport with it; the service maps it through
 * `narrow`; and what arrives is a real `Failure` that took a real round trip and
 * carries real ids. The only thing invented is which kind the server chose.
 *
 * # What it is actually for
 *
 * Two things a screen can only claim until somebody looks:
 *
 *   1. that a caller cannot receive a kind the signature did not promise, and
 *   2. that when the server sends one anyway, nothing is lost.
 *
 * `listSessions` promises `TransportFailure` and no domain kind at all. Force a
 * `not_found` and what arrives is `internal` — folded, because the operation
 * never promised absence — with the original preserved in the cause chain. The
 * "cause" column below is that fold made visible.
 */

const PLAN = (kind: string) => `?chaos=GET /auth/sessions=fail:${kind}`;

/** What a screen is actually obliged to write. Ten branches, no default, and
 *  `assertNever` at the end — so adding a kind to the union breaks the build
 *  here rather than falling through to a shrug. */
function handling(failure: Failure): {
  verdict: string;
  surface: string;
} {
  switch (failure.kind) {
    case "unauthenticated":
      return {
        verdict: "send them to sign in",
        surface: "a redirect, not a message",
      };
    case "forbidden":
      return {
        verdict: "say no, and do not offer a retry",
        surface: "an inline refusal",
      };
    case "rate_limited":
      return {
        verdict: `wait ${failure.retryAfter ?? "?"}s, then retry`,
        surface: "a countdown, not an error",
      };
    case "unavailable":
      return {
        verdict: "retry with backoff",
        surface: "keep the last good value on screen",
      };
    case "timeout":
      return {
        verdict: "retry with backoff",
        surface: "a retry control",
      };
    case "canceled":
      return {
        verdict: "do nothing at all",
        surface: "nothing — they asked",
      };
    case "internal":
      return {
        verdict: "report it with the reference",
        surface: "an apology and the id",
      };
    case "not_found":
      return {
        verdict: "this read never promised it",
        surface: "folded to internal",
      };
    case "invalid":
      return {
        verdict: "put each message on its field",
        surface: `${Object.keys(failure.fields).length} field message(s)`,
      };
    case "conflict":
      return {
        verdict: "the world moved; re-read and re-offer",
        surface: "a message above the form",
      };
    default:
      return assertNever(failure, "failure kind");
  }
}
export default function FailuresPage(
  props: Extract<
    Awaited<ReturnType<typeof getFailureExample>>,
    {
      state: "ready";
    }
  >,
) {
  return (
    <Container width="page">
      <Flex direction="column" gap={7}>
        <div>
          <h1 class={s.title}>Failures</h1>
          <p class={s.lead}>
            Every kind, forced through the real stack. Each link reloads this
            screen with a chaos plan; the proxy puts it in a header, the
            composition root wraps the transport with it, and what arrives below
            took a real round trip and carries real ids. The only invented thing
            is which kind the server chose.
          </p>
        </div>

        <Panel title="Force one">
          <Flex direction="column" gap={5}>
            <div>
              <div class={s.groupLabel}>
                Transport — any call can produce these, and no signature may
                declare them away
              </div>
              <Flex gap={3} wrap>
                <For each={TRANSPORT_KINDS}>
                  {(kind) => (
                    <Link
                      href={`/cookbook/failures${PLAN(kind)}`}
                      class={s.chip}
                      data-on={
                        props.forced?.includes(`:${kind}`) ? "" : undefined
                      }
                    >
                      {kind}
                    </Link>
                  )}
                </For>
              </Flex>
            </div>
            <div>
              <div class={s.groupLabel}>
                Domain — an operation says which of these it can produce. This
                read says NONE
              </div>
              <Flex gap={3} wrap>
                <For each={DOMAIN_KINDS}>
                  {(kind) => (
                    <Link
                      href={`/cookbook/failures${PLAN(kind)}`}
                      class={s.chip}
                      data-on={
                        props.forced?.includes(`:${kind}`) ? "" : undefined
                      }
                    >
                      {kind}
                    </Link>
                  )}
                </For>
              </Flex>
            </div>
            <Flex gap={4} wrap>
              <Link href="/cookbook/failures" class={s.chip}>
                none — succeed
              </Link>
              <Link
                href="/cookbook/failures?chaos=GET /auth/sessions=empty:list"
                class={s.chip}
              >
                empty:list
              </Link>
              <Link
                href="/cookbook/failures?chaos=GET /auth/sessions=latency:3000"
                class={s.chip}
              >
                latency:3000
              </Link>
            </Flex>
          </Flex>
        </Panel>

        {props.failure ? (
          <Anatomy
            failure={props.failure}
            rootCorrelation={props.root.correlationId}
          />
        ) : (
          <Alert tone="info" title="The read succeeded">
            {props.failure === null
              ? `${props.count} session(s), and no failure to dissect. Force one above.`
              : null}
          </Alert>
        )}

        <Panel title="The whole union, and what each branch owes">
          <Table>
            <THead>
              <Tr>
                <Th>kind</Th>
                <Th>half</Th>
                <Th>retryable</Th>
                <Th>a caller must</Th>
              </Tr>
            </THead>
            <TBody>
              <For each={FAILURE_KINDS}>
                {(kind) => (
                  <Tr>
                    <Td>
                      <Link
                        href={`/cookbook/failures${PLAN(kind)}`}
                        class={s.mono}
                      >
                        {kind}
                      </Link>
                    </Td>
                    <Td>
                      <Badge
                        tone={
                          (TRANSPORT_KINDS as readonly string[]).includes(kind)
                            ? "accent"
                            : "warn"
                        }
                      >
                        {(TRANSPORT_KINDS as readonly string[]).includes(kind)
                          ? "transport"
                          : "domain"}
                      </Badge>
                    </Td>
                    <Td>{retryVerdict(kind)}</Td>
                    <Td class={s.quiet}>{ADVICE[kind]}</Td>
                  </Tr>
                )}
              </For>
            </TBody>
          </Table>
          <p class={s.note}>
            Ten kinds and no eleventh. The switch that renders the panel above
            has a branch for each and <code>assertNever</code> at the end, so
            adding one to the union breaks the build here rather than falling
            through to a shrug at runtime.
          </p>
        </Panel>
      </Flex>
    </Container>
  );
}
const ADVICE: Record<FailureKind, string> = {
  unauthenticated: "send them to sign in",
  forbidden: "say no; never offer a retry for an answer",
  rate_limited: "honour the server's own retry-after",
  unavailable: "retry with backoff, keep the last good value",
  timeout: "retry with backoff",
  canceled: "do nothing — they asked",
  internal: "report it, quoting the reference",
  not_found: "declare it, or it folds to internal",
  invalid: "put each message beside its field",
  conflict: "re-read and re-offer; never retry blindly",
};
const retryVerdict = (kind: FailureKind): string => {
  const sample = {
    kind,
    message: "",
  } as Failure;
  const delay = retryDelay(sample, 0);
  return delay === null ? "no — it is an answer" : `after ${delay}ms`;
};
function Anatomy(props: { failure: Failure; rootCorrelation: string }) {
  const decided = createMemo(() => handling(props.failure));
  const causes = createMemo(() => chain(props.failure));
  const form = createMemo(() => toFormState(props.failure));
  return (
    <Flex gap={6} wrap>
      <Panel title="What arrived">
        <dl class={s.facts}>
          <Fact label="kind" value={props.failure.kind} mono />
          <Fact
            label="half"
            value={
              isTransport(props.failure)
                ? "transport — cannot be narrowed away"
                : "domain — an operation may declare it"
            }
          />
          <Fact label="message" value={props.failure.message} />
          <Fact label="type" value={props.failure.type ?? "–"} mono />
          <Fact
            label="status"
            value={
              props.failure.status === undefined
                ? "–"
                : String(props.failure.status)
            }
            mono
          />
          <Fact
            label="requestId"
            value={props.failure.requestId ?? "–"}
            hint="this attempt. Different on a retry."
            mono
          />
          <Fact
            label="correlationId"
            value={props.failure.correlationId ?? "–"}
            hint={
              props.failure.correlationId === props.rootCorrelation
                ? "this interaction — the same on every call this render made"
                : "this interaction"
            }
            mono
          />
        </dl>
      </Panel>

      <Panel title="What a caller may do about it">
        <dl class={s.facts}>
          <Fact
            label="retryable"
            value={isRetryable(props.failure) ? "yes" : "no — it is an ANSWER"}
          />
          <Fact
            label="retryDelay"
            value={[0, 1, 2]
              .map((n) => retryDelay(props.failure, n))
              .map((d) => (d === null ? "never" : `${d}ms`))
              .join(" · ")}
            hint="attempt 0 · 1 · 2, and the cache asks exactly this"
            mono
          />
          <Fact label="verdict" value={decided().verdict} />
          <Fact label="surface" value={decided().surface} />
          <Fact label="as form state" value={JSON.stringify(form())} mono />
        </dl>
      </Panel>

      <Panel
        title={
          causes().length > 1 ? "Folded — the cause survived" : "Cause chain"
        }
      >
        {(() => {
          const _causesSnapshot = causes();
          return _causesSnapshot.length > 1 ? (
            <Flex direction="column" gap={4}>
              <p class={s.note}>
                This read promised <strong>no domain kind</strong>, so the one
                the server sent could not be handed to a caller whose type says
                it cannot occur. <code>narrow</code> folded it to{" "}
                <code>internal</code> and kept the original underneath — the
                signature stays true and nothing is lost.
              </p>
              <ol class={s.chain}>
                {
                  <For each={_causesSnapshot}>
                    {(link) => (
                      <li class={s.link}>
                        <span class={s.mono}>{link.kind}</span>
                        <span class={s.quiet}>{link.message}</span>
                      </li>
                    )}
                  </For>
                }
              </ol>
              <p class={s.note}>
                <code>rootCause</code> is{" "}
                <span class={s.mono}>{rootCause(props.failure).kind}</span> —
                what the server actually said, still reachable.
              </p>
            </Flex>
          ) : (
            <p class={s.note}>
              One link: the operation promised this kind, so it arrived
              unchanged. Force a <code>not_found</code>, <code>invalid</code> or{" "}
              <code>conflict</code> to see a fold — this read declares none of
              them.
            </p>
          );
        })()}
      </Panel>
    </Flex>
  );
}
function Fact(props: {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
}) {
  const _hintSlot = createMemo(() => props.hint);
  return (
    <div class={s.fact}>
      <dt class={s.factLabel}>{props.label}</dt>
      <dd class={props.mono ? s.mono : undefined}>
        {props.value}
        {_hintSlot() ? <div class={s.quiet}>{_hintSlot()}</div> : null}
      </dd>
    </div>
  );
}
