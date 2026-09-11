import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { JobsDemo } from "./jobs-demo";
export default function Page() {
  return (
    <Container width="page">
      <Flex direction="column" gap={8}>
        <PageHeader
          title="Follow work that outlives a request"
          description="Observe an import or export, reconnect to its latest state, and distinguish stopping observation from requesting cancellation."
        />
        <JobsDemo />
      </Flex>
    </Container>
  );
}
