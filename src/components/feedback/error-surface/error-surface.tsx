import type { JSX } from "solid-js";
import { createMemo } from "solid-js";
import { Button } from "~/components/forms";
import type { Failure } from "~/lib/kernel";
import { cn, isRetryable } from "~/lib/kernel";
import s from "./error-surface.module.css";
export type ErrorSurfaceProps = {
  failure: Failure;
  /** Next's digest, present only when the throw happened on the SERVER.
   *
   *  Its presence is the signal that the message has been replaced: in a
   *  production build a server error is redacted before a client boundary sees
   *  it, and the digest is the only thing that still points at the real one. */
  digest?: string;
  title?: string;
  /** The boundary's own reset. Offered only when trying again could change the
   *  answer — see below. */
  onRetry?: () => void;
  action?: JSX.Element;
  class?: string;
};

/** What a reader is told when a screen could not render.
 *
 *  # The two throws it receives are not equally informative
 *
 *      from a CLIENT component   an `AppError` still holding its `Failure`.
 *                                Kind, message, ids — all intact.
 *      from a SERVER component   redacted in production. The message is
 *                                replaced with a generic one and only `digest`
 *                                survives.
 *
 *  So this must not present a redacted message as though it meant something.
 *  When a digest is present it says the detail is on the server and gives the
 *  reference; when it is absent it can say what actually went wrong.
 *
 *  # A retry is offered only when it could work
 *
 *  A refusal is an ANSWER, and a button that cannot change it is a control that
 *  does nothing. The kernel decides — except for a redacted failure, where the
 *  kind is unknowable and trying again is the honest default. */
export function ErrorSurface(props: ErrorSurfaceProps) {
  const redacted = createMemo(() => Boolean(props.digest));
  const worthRetrying = createMemo(
    () => redacted() || isRetryable(props.failure),
  );
  return (
    <div class={cn(s.surface, props.class)} role="alert">
      <h2 class={s.title}>{props.title ?? "This did not load"}</h2>

      <p class={s.body}>
        {redacted()
          ? "Something went wrong on the server. The details are in its log — quote the reference below."
          : props.failure.message}
      </p>

      <dl class={s.refs}>
        {props.digest ? <Ref label="digest" value={props.digest} /> : null}
        {props.failure.correlationId ? (
          <Ref label="interaction" value={props.failure.correlationId} />
        ) : null}
        {props.failure.requestId ? (
          <Ref label="request" value={props.failure.requestId} />
        ) : null}
        {/* The kind is only worth showing when it is the real one. A redacted
            error always classifies as `internal`, and printing that would be
            reporting the redaction rather than the fault. */}
        {!redacted() ? <Ref label="kind" value={props.failure.kind} /> : null}
      </dl>

      <div class={s.actions}>
        {worthRetrying() && props.onRetry ? (
          <Button onClick={props.onRetry}>Try again</Button>
        ) : null}
        {props.action}
      </div>

      {!worthRetrying() ? (
        <p class={s.quiet}>
          Trying again will not change this — it is an answer, not a fault.
        </p>
      ) : null}
    </div>
  );
}
function Ref(props: { label: string; value: string }) {
  return (
    <div class={s.ref}>
      <dt class={s.refLabel}>{props.label}</dt>
      <dd class={s.refValue}>{props.value}</dd>
    </div>
  );
}
