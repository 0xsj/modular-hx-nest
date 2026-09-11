import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { ResilienceDemo } from "./resilience-demo";
export default function ResiliencePage() {
  return (
    <Container width="page">
      <Flex direction="column" gap={8}>
        <PageHeader
          title="Build for the unexpected"
          description="Break a response, change the order, interrupt a save. Each example keeps a specific promise to the person using it."
        />
        <ResilienceDemo />
      </Flex>
    </Container>
  );
}
