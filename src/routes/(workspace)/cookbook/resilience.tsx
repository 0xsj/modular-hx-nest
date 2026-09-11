import { Title } from "@solidjs/meta";
import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { ResilienceDemo } from "~/examples/(workspace)/cookbook/(recipes)/resilience/resilience-demo";
import { Guard } from "~/lib/app/guard";
export default function Page() {
  return (
    <Guard>
      {(_user) => (
        <Container width="page">
          <Title>Build for the unexpected · cookbook</Title>
          <Flex direction="column" gap={7}>
            <PageHeader
              title="Build for the unexpected"
              description="Break a response, change the order, interrupt a save. Each example keeps a specific promise to the person using it."
            />
            <ResilienceDemo />
          </Flex>
        </Container>
      )}
    </Guard>
  );
}
