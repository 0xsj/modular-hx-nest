import { Title } from "@solidjs/meta";
import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { JobsDemo } from "~/examples/(workspace)/cookbook/(recipes)/jobs/jobs-demo";
import { Guard } from "~/lib/app/guard";
export default function Page() {
  return (
    <Guard>
      {(_user) => (
        <Container width="page">
          <Title>Follow work that outlives a request · cookbook</Title>
          <Flex direction="column" gap={7}>
            <PageHeader
              title="Follow work that outlives a request"
              description="Observe an import or export, reconnect to its latest state, and distinguish stopping observation from requesting cancellation."
            />
            <JobsDemo />
          </Flex>
        </Container>
      )}
    </Guard>
  );
}
