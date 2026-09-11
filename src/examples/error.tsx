import { A as Link } from "@solidjs/router";
import { ErrorSurface } from "~/components/feedback";
import { Button } from "~/components/forms";
import { Container, Flex } from "~/components/layout";
import { asFailure } from "~/lib/kernel";

/* Everything under the root layout, and the reason `AppError` exists.
 *
 * The kernel's rule is that nothing below the React edge throws — a failure is
 * a value all the way up. This is the edge. `unwrap` converts exactly once, and
 * this converts back, so one vocabulary serves both directions.
 *
 * # `asFailure` is TOTAL, which is what makes this safe
 *
 * An error boundary that can itself fail replaces one diagnosis with a worse
 * one. Whatever arrives here — an `AppError` carrying a real `Failure`, a
 * redacted server `Error`, a string somebody threw — becomes a `Failure`, and
 * the render below has no branch that can be missed.
 *
 * # A digest means the message is gone
 *
 * Next redacts a server error before a client boundary sees it in production:
 * the message is replaced and only the digest survives. So the surface below
 * does not present a redacted message as though it meant something — that is
 * the whole reason `digest` is passed down rather than logged and dropped. */
export default function AppErrorBoundary(props: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  return (
    <Container width="measure">
      <Flex direction="column" gap={7} py={12}>
        <ErrorSurface
          failure={asFailure(props.error)}
          digest={props.error.digest}
          onRetry={props.reset}
          action={
            <Button
              asChild={(forwarded) => (
                <Link {...forwarded()} href="/">
                  Go home
                </Link>
              )}
              intent="ghost"
            />
          }
        />
      </Flex>
    </Container>
  );
}
