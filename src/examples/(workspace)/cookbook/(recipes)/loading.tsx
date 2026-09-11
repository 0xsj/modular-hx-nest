import { For } from "solid-js";
import { Panel } from "~/components/display";
import { Skeleton } from "~/components/feedback";
import { Container, Flex } from "~/components/layout";

/* Streams the shell while the screen is still fetching.
 *
 * Every screen behind the guard is dynamic — it reads a cookie — so without
 * this the whole page waits on the slowest read and arrives at once. With it,
 * the header and sidebar paint immediately and only the content waits.
 *
 * The shape of what is coming, not a spinner: a skeleton that is the wrong
 * shape is a spinner with more code and a worse reveal. */
export default function Loading() {
  return (
    <Container width="page">
      <Flex direction="column" gap={7}>
        <Flex direction="column" gap={4}>
          <Skeleton height="26px" width="40%" />
          <Skeleton height="16px" width="70%" />
        </Flex>
        <Flex gap={6} wrap>
          <For each={[0, 1]}>
            {(_n) => (
              <Panel title="">
                <Flex direction="column" gap={4}>
                  <Skeleton height="16px" />
                  <Skeleton height="16px" width="60%" />
                  <Skeleton height="16px" width="80%" />
                </Flex>
              </Panel>
            )}
          </For>
        </Flex>
      </Flex>
    </Container>
  );
}
