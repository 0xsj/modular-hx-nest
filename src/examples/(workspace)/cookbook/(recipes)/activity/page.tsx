import { Container, Flex } from "~/components/layout";
import type { User } from "~/lib/services/session/session.types";
import { ActivityTable } from "./activity-table";
import s from "./page.module.css";
/* A server component that guards, and a client island that reads.
 *
 * The split is the point: the guard belongs on the server because the session
 * cookie is only readable there, and the list belongs in the cache because it
 * pages, filters and refetches — three things a server render would have to do
 * with a full round trip each. Cache-backed resource writes use the same boundary. */
export default function ActivityPage(props: { user: User }) {
  return (
    <Container width="page">
      <Flex direction="column" gap={7}>
        <div>
          <h1 class={s.title}>Activity</h1>
          <p class={s.lead}>
            Everything recorded on {props.user.email}. These rows are not
            invented: the fixture writes one as a side effect of each operation,
            the way a server would — so signing in adds a row, and revoking a
            session adds another. Every row carries the interaction it belonged
            to.
          </p>
        </div>

        <ActivityTable />
      </Flex>
    </Container>
  );
}
