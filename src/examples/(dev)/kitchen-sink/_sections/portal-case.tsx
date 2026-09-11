import { createSignal } from "solid-js";
import { Button } from "~/components/forms";
import { Flex } from "~/components/layout";
import { Portal } from "~/components/utility";
import s from "../_components/sink.module.css";

/* Both halves of the portal are demonstrable and neither is obvious from the
 * markup: the DOM parent moves, and the logical parent does not. */
export function PortalCase() {
  const [out, setOut] = createSignal(false);
  const [target, setTarget] = createSignal<HTMLElement | null>(null);
  const [bubbled, setBubbled] = createSignal(0);
  const escapee = (
    <div class={s.escapee}>
      <span>I am taller than my ancestor</span>
      <Button size="sm">click me</Button>
    </div>
  );
  return (
    <Flex direction="column" gap={5}>
      <Flex gap={4} align="center">
        <Button size="sm" onClick={() => setOut((v) => !v)}>
          {out() ? "put it back" : "portal it out"}
        </Button>
        <span class={s.mono}>
          clicks that reached the logical parent: {bubbled()}
        </span>
      </Flex>

      {/* The handler sits on the clipping box. The button above is rendered
          from inside it either way — so when it is portalled, the click is
          reaching a handler that is no longer a DOM ancestor. */}
      <div class={s.clip} onClick={() => setBubbled((n) => n + 1)}>
        <span class={s.mono}>overflow: hidden</span>
        {out() ? null : escapee}
        {(() => {
          const _targetSnapshot = target();
          return out() && _targetSnapshot ? (
            <Portal container={_targetSnapshot}>{escapee}</Portal>
          ) : null;
        })()}
      </div>

      <div ref={setTarget} class={s.portalTarget}>
        <span class={s.mono}>portal container</span>
      </div>
    </Flex>
  );
}
