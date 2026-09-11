import { A as Link } from "@solidjs/router";
import { For } from "solid-js";
import { Badge, Empty, Panel, Stat } from "~/components/display";
import { Alert } from "~/components/feedback";
import { Box, Container, Flex } from "~/components/layout";
import type { getDashboard } from "~/lib/app/route-data";
import { OtherDevices } from "./other-devices";
import s from "./page.module.css";
/* The one screen behind the shell, and it is a placeholder on purpose.
 *
 * What it demonstrates is the layering, not a product: a server component asks
 * the composition root for a client, the root was handed a token read from a
 * cookie by the only file that knows about cookies, and the service that
 * answered has no idea any of that happened.
 *
 * # Two panels read the same thing down two different paths
 *
 * Deliberately, because they are the two paths a real screen has and they fail
 * differently. The server panel runs at render, is chaos-able through the query
 * string, and renders its three states as markup. The client panel runs in the
 * browser through the cache, over a fetch adapter pointed at this application's
 * own route handler — and its retry policy asks the kernel rather than a status
 * code. A template that only ever showed one of the two would be teaching half
 * the architecture.
 *
 * `requireUser` is called again here rather than passed down from the layout.
 * That is not a second request — React's `cache` makes it the same one — and it
 * means this page is guarded on its own terms rather than by a parent it has to
 * trust. */
export default function AppPage(
  props: Extract<
    Awaited<ReturnType<typeof getDashboard>>,
    {
      state: "ready";
    }
  >,
) {
  return (
    <Container width="page">
      <Flex direction="column" gap={7}>
        <div>
          <h1 class={s.title}>Welcome back, {props.user.name.split(" ")[0]}</h1>
          <p class={s.lead}>
            You are signed in. Everything below came through the same tiers a
            product would use — there is simply no product here yet.
          </p>
        </div>

        {props.root.underChaos ? (
          /* A forced failure that looks real is an afternoon wasted, so a
         surface running under a chaos plan says so before anything else. */
          <Alert tone="warn" title="A chaos plan is in force">
            Failures on this page are being manufactured from the query string.
            Nothing below the composition root knows that.
          </Alert>
        ) : null}

        {props.root.fixtures ? (
          /* Transport-level provenance, rendered. "Nobody looked" and "a fixture
         answered" are different claims, and a screen that shows them alike
         has thrown away the difference at the moment it had it. */
          <Alert tone="info" title="Answered by fixtures">
            No <code>API_BASE_URL</code> is set, so every call is served from
            the in-memory route table. Set one and the adapter changes; nothing
            above <code>lib/root</code> changes at all.
          </Alert>
        ) : null}

        <Flex gap={6} wrap>
          <Panel title="Session">
            <Flex direction="column" gap={5}>
              <Stat label="Signed in as" value={props.user.email} />
              <Stat label="User id" value={props.user.id} />
              <Box>
                <Badge tone={props.root.fixtures ? "warn" : "accent"}>
                  {props.root.fixtures ? "fixtures" : "network"}
                </Badge>
              </Box>
            </Flex>
          </Panel>

          <Panel title="This interaction">
            <Flex direction="column" gap={5}>
              <Stat label="Correlation id" value={props.root.correlationId} />
              <p class={s.note}>
                One root per interaction, so both reads this render made carry
                this id — and either failure would name it. Build a root per
                request instead and it degenerates into a second request id.
              </p>
            </Flex>
          </Panel>
        </Flex>

        <Flex gap={6} wrap>
          <Panel title="Other sessions, at render">
            {props.presence.state === "unmeasured" ? (
              /* NOBODY LOOKED. Never rendered as emptiness — that is the
             collapse the three states exist to prevent. */
              <Alert tone="crit" title={props.presence.failure.message}>
                Nobody looked, which is not the same as finding nothing.
                {props.presence.failure.correlationId
                  ? ` Reference ${props.presence.failure.correlationId}.`
                  : null}
              </Alert>
            ) : props.presence.state === "empty" ? (
              <Empty
                title="Only this one"
                body="You are not signed in anywhere else."
              />
            ) : (
              <ul class={s.list}>
                <For each={props.presence.value}>
                  {(session) => (
                    <li class={s.item}>
                      <span class={s.id}>{session.id}</span>
                      <span class={s.meta}>
                        since{" "}
                        {new Date(session.createdAt)
                          .toISOString()
                          .slice(0, 16)
                          .replace("T", " ")}
                      </span>
                    </li>
                  )}
                </For>
              </ul>
            )}
          </Panel>

          {/* The same read, in the browser, through the cache. */}
          <OtherDevices />
        </Flex>

        <Panel title="Forcing a state">
          <Flex direction="column" gap={4}>
            <p class={s.note}>
              The chaos module wraps the transport at the composition root, so
              these work on this screen and on the sign-in form — not only on a
              page written to demonstrate them. Nothing below the root can tell.
            </p>
            <ul class={s.plans}>
              <For
                each={[
                  [
                    "?chaos=GET /auth/sessions=fail:unavailable",
                    "nobody looked, and it is retryable",
                  ],
                  [
                    "?chaos=GET /auth/sessions=fail:forbidden",
                    "an ANSWER — no retry is offered",
                  ],
                  [
                    "?chaos=GET /auth/sessions=empty:list",
                    "looked and found nothing",
                  ],
                  [
                    "?chaos=GET /auth/sessions=latency:2000",
                    "a slow render, and a real skeleton",
                  ],
                  [
                    "?chaos=GET /auth/me=fail:unauthenticated",
                    "the guard refuses, and you land back at sign-in",
                  ],
                ]}
              >
                {([plan, what]) => (
                  <li class={s.plan}>
                    <Link href={`/cookbook/dashboard${plan}`} class={s.id}>
                      {plan}
                    </Link>
                    <span class={s.meta}>{what}</span>
                  </li>
                )}
              </For>
            </ul>
          </Flex>
        </Panel>

        <Panel title="Where to go next">
          <Flex direction="column" gap={4}>
            <p class={s.note}>
              Use these examples as a reference while building in your own
              workspace. The component catalog shows the individual pieces.
            </p>
            <Flex gap={5} wrap>
              <Link href="/app">Your app</Link>
              <Link href="/kitchen-sink">Kitchen sink</Link>
              <Link href="/probe">Transport probe</Link>
            </Flex>
          </Flex>
        </Panel>
      </Flex>
    </Container>
  );
}
