import { A as Link } from "@solidjs/router";
import { Panel } from "~/components/display";
import { ErrorSurface } from "~/components/feedback";
import { Button } from "~/components/forms";
import { Container, Flex } from "~/components/layout";
import { asFailure } from "~/lib/kernel";
import { usePathname } from "~/lib/navigation";

/* A boundary INSIDE the shell, so the shell survives.
 *
 * A route-segment boundary replaces only what is below it — the header, the
 * sidebar and the preference toggles stay, and the reader can navigate away
 * instead of being dropped onto a bare page with a back button. That is the
 * whole argument for putting one here as well as at the root: the root's
 * catches things the shell itself could not render, and this catches a screen.
 *
 * It is reachable through the real stack: the guard throws when it could not
 * find out who you are — as opposed to finding out that you are nobody, which
 * is a redirect. `/cookbook/chaos` can produce it with
 * `GET /auth/me=fail:unavailable`. */
export default function ScreenErrorBoundary(props: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  const pathname = usePathname();
  const cookbook = () => pathname().startsWith("/cookbook");
  return (
    <Container width="page">
      <Flex direction="column" gap={6}>
        <Panel title="This screen did not load">
          <ErrorSurface
            failure={asFailure(props.error)}
            digest={props.error.digest}
            title="Something stopped it"
            onRetry={props.reset}
            action={
              <Button
                asChild={(forwarded) => (
                  <Link
                    {...forwarded()}
                    href={cookbook() ? "/cookbook" : "/app"}
                  >
                    {cookbook() ? "Cookbook" : "Home"}
                  </Link>
                )}
                intent="ghost"
              />
            }
          />
        </Panel>
      </Flex>
    </Container>
  );
}
