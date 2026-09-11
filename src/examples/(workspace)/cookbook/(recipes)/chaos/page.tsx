import { A as Link } from "@solidjs/router";
import { Panel } from "~/components/display";
import { Alert } from "~/components/feedback";
import { Container, Flex } from "~/components/layout";
import { AxisLegend, ChaosBuilder } from "./builder";
import s from "./page.module.css";
/* A place to break the application on purpose and watch what it does.
 *
 * The module was asked for to answer one question — *how does this behave when
 * the server misbehaves* — and that question cannot be answered on a screen
 * built to demonstrate it. So this page builds a plan and hands you links to
 * the REAL screens under it. Nothing here previews anything.
 *
 * `/cookbook/failures` is the other half and a different question: that one dissects
 * a single failure, this one lets you live with a broken server for a minute. */
export default function ChaosPage(props: { underChaos: boolean }) {
  return (
    <Container width="page">
      <Flex direction="column" gap={7}>
        <div>
          <h1 class={s.title}>Chaos</h1>
          <p class={s.lead}>
            Break the application on purpose, then use it. The plan is a query
            string; the proxy copies it into a header; the composition root
            wraps the transport with it. Nothing below the root knows chaos
            exists, which is what makes what you see the real behaviour rather
            than a mock of it.
          </p>
        </div>

        {props.underChaos ? (
          /* A surface running under a plan must say so before anything else. A
         forced failure that looks real is an afternoon wasted. */
          <Alert tone="warn" title="This page is itself under a chaos plan">
            Drop the query string to stop it.
          </Alert>
        ) : null}

        <ChaosBuilder />
        <AxisLegend />

        <Panel title="Where to look while it is on">
          <ul class={s.list}>
            <li>
              <strong>Overview</strong> — the same read runs twice, once at
              render and once in the browser through the cache. Under one plan
              you see both surfaces, and they should agree.
            </li>
            <li>
              <strong>Activity</strong> — paging, filtering and a legitimately
              empty result. Try <code>empty:list</code> here: it is a{" "}
              <em>success</em> with no rows, and it must not render like a
              failure.
            </li>
            <li>
              <strong>Sign in</strong> — the form under{" "}
              <code>fail:unavailable</code>. The message goes above the form,
              never on a field, because no single field was wrong.
            </li>
            <li>
              <strong>The guard, two ways.</strong> <code>GET /auth/me</code>{" "}
              under <code>fail:unauthenticated</code> puts you back at sign-in —
              the server answered, and nobody is signed in. The same route under{" "}
              <code>fail:unavailable</code> hits the{" "}
              <strong>error boundary inside the shell</strong> instead, because
              that is not an answer about your identity: sending you to a form
              that would fail the same way would be a lie that also loses your
              place.
            </li>
            <li>
              <strong>The optimistic write</strong> —{" "}
              <code>DELETE /auth/sessions/*</code> under any failure. The row
              leaves immediately and comes back, except under{" "}
              <code>fail:not_found</code>, where it correctly stays gone.
            </li>
          </ul>
          <p class={s.meta}>
            For the anatomy of one failure — its ids, its cause chain, whether
            it is retryable and what a caller owes it — see{" "}
            <Link href="/cookbook/failures">Failures</Link>.
          </p>
        </Panel>
      </Flex>
    </Container>
  );
}
