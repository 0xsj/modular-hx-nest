import { A as Link } from "@solidjs/router";
import type { JSX } from "solid-js";
import { createMemo, createSignal, For } from "solid-js";
import { Badge, Panel } from "~/components/display";
import { Alert } from "~/components/feedback";
import {
  Button,
  Field,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/forms";
import { Flex } from "~/components/layout";
import { FAILURE_KINDS } from "~/lib/kernel";
import s from "./page.module.css";

/* Build a plan, then go and use the app under it.
 *
 * The lab does not simulate anything. It composes a query string, and every
 * link below is the real application under that plan: the proxy copies the
 * query into a header, the composition root wraps the transport with it, and
 * nothing beneath the root knows chaos exists.
 *
 * That is why this is a builder and not a preview — a preview would be a
 * fifteenth screen behaving differently from the fourteen that matter. */

/** Every route the application actually calls. Written down because a plan
 *  aimed at a path nothing requests is a plan that appears to do nothing, and
 *  the first thing anyone does is mistype one. */
const TARGETS = [
  {
    pattern: "*",
    label: "everything",
    note: "every request, including the guard",
  },
  {
    pattern: "GET /auth/me",
    label: "the guard",
    note: "unauthenticated -> sign-in; anything else -> the error boundary",
  },
  {
    pattern: "GET /auth/sessions",
    label: "sessions",
    note: "read on the overview, server AND browser",
  },
  {
    pattern: "DELETE /auth/sessions/*",
    label: "revoke a session",
    note: "the optimistic write",
  },
  {
    pattern: "GET /me/activity",
    label: "activity",
    note: "the paged ledger read",
  },
  {
    pattern: "POST /auth/sign-in",
    label: "sign in",
    note: "the form, before you have a session",
  },
  {
    pattern: "POST /auth/sign-up",
    label: "sign up",
    note: "conflict lives here naturally",
  },
] as const;
const EFFECTS = [
  {
    value: "",
    label: "no effect",
    note: "",
  },
  ...FAILURE_KINDS.map((kind) => ({
    value: `fail:${kind}`,
    label: `fail: ${kind}`,
    note: "returns a failure instead of calling through",
  })),
  {
    value: "empty:list",
    label: "empty: list",
    note: "a SUCCESS with no rows — the branch nobody looks at",
  },
  {
    value: "empty:null",
    label: "empty: null",
    note: "a SUCCESS whose value is legitimately absent",
  },
  {
    value: "latency:2000",
    label: "latency: 2s",
    note: "reveals loading states",
  },
  {
    value: "latency:6000",
    label: "latency: 6s",
    note: "long enough to be annoying, which is the point",
  },
  {
    value: "hang",
    label: "hang",
    note: "never settles — the stuck-spinner case, not a timeout",
  },
] as const;
const SCREENS = [
  {
    href: "/cookbook/dashboard",
    label: "Overview",
  },
  {
    href: "/cookbook/activity",
    label: "Activity",
  },
  {
    href: "/cookbook/failures",
    label: "Failures",
  },
  {
    href: "/sign-in",
    label: "Sign in",
  },
] as const;
export function ChaosBuilder() {
  const [target, setTarget] = createSignal<string>("GET /me/activity");
  const [chosenValue, setEffect] = createSignal<string>("fail:unavailable");
  const effect = createMemo(() => {
    const _chosenValueSnapshot = chosenValue();
    return _chosenValueSnapshot === "none" ? "" : _chosenValueSnapshot;
  });
  const [seed, setSeed] = createSignal<string>("");
  const rule = createMemo(() => {
    const _effectSnapshot = effect();
    return _effectSnapshot ? `${target()}=${_effectSnapshot}` : "";
  });
  const query = createMemo(() => {
    const _ruleSnapshot = rule();
    return _ruleSnapshot
      ? `?chaos=${encodeURIComponent(_ruleSnapshot)}${seed() ? `&chaosSeed=${encodeURIComponent(seed())}` : ""}`
      : "";
  });
  const chosen = createMemo(() => TARGETS.find((t) => t.pattern === target()));
  const chosenEffect = createMemo(() =>
    EFFECTS.find((e) => e.value === effect()),
  );
  return (
    <Flex direction="column" gap={6}>
      <Panel title="Build a plan">
        <Flex direction="column" gap={6}>
          <Flex gap={5} wrap>
            <div class={s.control}>
              <Field label="Target">
                {(c) => (
                  <Select
                    value={target()}
                    onValueChange={setTarget}
                    items={[
                      ...TARGETS.map((t) => ({
                        value: t.pattern,
                        label: t.label,
                      })),
                    ]}
                  >
                    <SelectTrigger {...c}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <For each={TARGETS}>
                        {(t) => (
                          <SelectItem value={t.pattern}>{t.label}</SelectItem>
                        )}
                      </For>
                    </SelectContent>
                  </Select>
                )}
              </Field>
              {(() => {
                const _chosenSnapshot = chosen();
                return _chosenSnapshot ? (
                  <p class={s.meta}>{_chosenSnapshot.note}</p>
                ) : null;
              })()}
            </div>

            <div class={s.control}>
              <Field label="Effect">
                {(c) => (
                  <Select
                    value={chosenValue()}
                    onValueChange={setEffect}
                    items={[
                      ...EFFECTS.map((e) => ({
                        value: e.value || "none",
                        label: "" + "" + e.label + "",
                      })),
                    ]}
                  >
                    <SelectTrigger {...c}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <For each={EFFECTS}>
                        {(e) => (
                          /* Radix forbids an empty-string item value, because it
                       reserves "" for the cleared state. "none" is the
                       sentinel and it is mapped back below. */
                          <SelectItem value={e.value || "none"}>
                            {e.label}
                          </SelectItem>
                        )}
                      </For>
                    </SelectContent>
                  </Select>
                )}
              </Field>
              {(() => {
                const _chosenEffectSnapshot = chosenEffect();
                return _chosenEffectSnapshot?.note ? (
                  <p class={s.meta}>{_chosenEffectSnapshot.note}</p>
                ) : null;
              })()}
            </div>

            <div class={s.control}>
              <Field
                label="Seed"
                hint="Only matters for a probabilistic rule. A bug you cannot reproduce is an anecdote."
              >
                {(c) => (
                  <Input
                    {...c}
                    value={seed()}
                    onInput={(e) => setSeed(e.target.value)}
                    placeholder="optional"
                  />
                )}
              </Field>
            </div>
          </Flex>

          <div>
            <div class={s.groupLabel}>the plan</div>
            <pre class={s.code}>
              <code>{query() || "— no effect chosen —"}</code>
            </pre>
            <p class={s.meta}>
              <code>METHOD /path</code>, where <code>*</code> covers a run of
              segments. First match wins, so a specific rule goes before{" "}
              <code>*</code>. Several rules join with <code>;</code>.
            </p>
          </div>
        </Flex>
      </Panel>

      <Panel title="Now go and use the app under it">
        <Flex direction="column" gap={5}>
          <Flex gap={4} wrap>
            <For each={SCREENS}>
              {(screen) => (
                <Button
                  asChild={(forwarded) => (
                    <Link {...forwarded()} href={`${screen.href}${query()}`}>
                      {screen.label}
                    </Link>
                  )}
                  intent={query() ? "primary" : "secondary"}
                  size="sm"
                />
              )}
            </For>
          </Flex>
          <p class={s.meta}>
            These are the real screens, not previews. The plan travels in the
            query string, so it survives a navigation within a screen and stops
            the moment you drop it — and a surface running under one says so,
            which is why a forced failure never looks like a real one.
          </p>
        </Flex>
      </Panel>

      <Alert tone="info" title="It is a no-op in production, structurally">
        <span class={s.meta}>
          <code>withChaos</code> returns the client untouched in a production
          build, and the proxy does not set the header there — so this is not a
          feature flag that can be left on. The decorator wraps the transport at
          the composition root, which is why nothing below it can tell.
        </span>
      </Alert>
    </Flex>
  );
}
export function AxisLegend() {
  return (
    <Panel title="Four axes, and the second is the one nobody asks for">
      <dl class={s.axes}>
        <Axis name="fail" tone="crit">
          Return a failure instead of calling through. Ten kinds, and the one
          you reach for is rarely the one that breaks a screen.
        </Axis>
        <Axis name="empty" tone="warn">
          Return a <strong>success</strong> that is empty. In development a
          fixture always has data, so the empty branch of every screen ships
          unlooked-at — and it is a different branch from failure, not a milder
          one.
        </Axis>
        <Axis name="latency">
          Wait, then do the real thing. Reveals every loading state, including
          the ones nobody drew.
        </Axis>
        <Axis name="hang">
          Never settle. <strong>Not</strong> a timeout — chaos wraps the client
          rather than living inside it, so it cannot trip the transport&rsquo;s
          own budget. This is the stuck spinner: a screen with no timeout of its
          own hangs forever. For the failure a real timeout produces, use{" "}
          <code>fail: timeout</code>. A cancellation is still honoured.
        </Axis>
      </dl>
    </Panel>
  );
}
function Axis(props: {
  name: string;
  tone?: "crit" | "warn";
  children: JSX.Element;
}) {
  return (
    <div class={s.axis}>
      <dt>
        <Badge tone={props.tone}>{props.name}</Badge>
      </dt>
      <dd class={s.meta}>{props.children}</dd>
    </div>
  );
}
