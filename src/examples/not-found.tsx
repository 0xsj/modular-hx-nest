import { A as Link } from "@solidjs/router";
import { Empty } from "~/components/display";
import { Button } from "~/components/forms";
import { Container, Flex } from "~/components/layout";

/* An unmatched URL, and anything that called `notFound()`.
 *
 * Deliberately NOT an error surface. A page that does not exist is an ANSWER —
 * the server looked and there is nothing there — and rendering it in the same
 * red as a failed request teaches people that both mean "something is broken".
 * `Empty` is the component for a successful nothing, and this is one.
 *
 * There is no reference to quote, because nothing went wrong. */
export default function NotFound() {
  return (
    <Container width="measure">
      <Flex direction="column" gap={7} py={12}>
        <Empty
          title="There is nothing at this address"
          body="The link may be old, or the page may have moved."
          action={
            <Button
              asChild={(forwarded) => (
                <Link {...forwarded()} href="/">
                  Go home
                </Link>
              )}
            />
          }
        />
      </Flex>
    </Container>
  );
}
