import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { LiveDemo } from "./live-demo";
export default function LiveUpdatesPage() {
  return (
    <Container>
      <Flex direction="column" gap={8}>
        <PageHeader
          title="Keep the view in step"
          description="Live updates, missed events, and a connection that can recover without losing the page around it."
        />
        <LiveDemo />
      </Flex>
    </Container>
  );
}
