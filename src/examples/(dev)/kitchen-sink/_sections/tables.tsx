import {
  Empty,
  Mock,
  Panel,
  Presence,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "~/components/display";
import { Alert, SkeletonText } from "~/components/feedback";
import { Text } from "~/components/typography";
import { Case, Section } from "../_components/section";
import s from "../_components/sink.module.css";
import { readSources } from "../_lib/source";
import { TableDemo } from "./table-demo";
export function TablesSection() {
  return (
    <Section
      id="tables"
      title="Tables"
      blurb="Native table elements with composable cells. The caller owns the collection, its query, and its selection; the table owns the presentation and semantics."
    >
      <Case
        title="Collection table"
        note="sort, filter, select, and page the same collection"
        sources={readSources([
          "display/table/table.tsx",
          "display/table/sortable-th.tsx",
          "patterns/collection-toolbar/collection-toolbar.tsx",
        ])}
      >
        <TableDemo />
      </Case>
      <Case
        title="Cell composition"
        note="zero, empty, and unmeasured remain different answers"
      >
        <Panel title="Source coverage" actions={<Mock />} flush>
          <Table caption="Example measurements by source">
            <THead>
              <Tr>
                <Th>Source</Th>
                <Th numeric>Matches</Th>
                <Th>Version</Th>
              </Tr>
            </THead>
            <TBody>
              <Tr>
                <Th scope="row">Primary</Th>
                <Td numeric>12</Td>
                <Td>
                  <Presence
                    of={{
                      state: "found",
                      value: "1.4.2",
                    }}
                  >
                    {(value) => value}
                  </Presence>
                </Td>
              </Tr>
              <Tr>
                <Th scope="row">Archive</Th>
                <Td numeric>0</Td>
                <Td>
                  <Presence
                    of={{
                      state: "empty",
                    }}
                  >
                    {(value: string) => value}
                  </Presence>
                </Td>
              </Tr>
              <Tr>
                <Th scope="row">Remote</Th>
                <Td numeric>
                  <Presence
                    of={{
                      state: "unmeasured",
                      failure: {
                        kind: "timeout",
                        message: "The source did not respond.",
                      },
                    }}
                  >
                    {(value: number) => value}
                  </Presence>
                </Td>
                <Td>
                  <Presence
                    of={{
                      state: "unmeasured",
                      failure: {
                        kind: "timeout",
                        message: "The source did not respond.",
                      },
                    }}
                  >
                    {(value: string) => value}
                  </Presence>
                </Td>
              </Tr>
            </TBody>
          </Table>
        </Panel>
      </Case>
      <Case
        title="Collection states"
        note="loading is temporary; empty is a successful read; failure needs its own explanation"
      >
        <div class={s.fieldGrid}>
          <Panel title="Loading">
            <div aria-busy="true" aria-label="Loading projects">
              <SkeletonText lines={3} />
            </div>
            <Text size="sm" tone="muted">
              Loading projects…
            </Text>
          </Panel>
          <Panel title="Empty">
            <Empty
              title="No projects yet"
              body="Projects will appear here once your workspace has one."
            />
          </Panel>
          <Panel title="Unavailable">
            <Alert tone="crit" title="Projects could not be loaded">
              The source did not respond. Your existing projects have not been
              removed.
            </Alert>
          </Panel>
        </div>
      </Case>
    </Section>
  );
}
