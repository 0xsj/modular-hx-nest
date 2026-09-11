import { Title } from "@solidjs/meta";
import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { LiveDemo } from "~/examples/(workspace)/cookbook/(recipes)/live-updates/live-demo";
import { Guard } from "~/lib/app/guard";
export default function Page() {
  return (
    <Guard>
      {(_user) => (
        <Container width="page">
          <Title>Keep the view in step · cookbook</Title>
          <Flex direction="column" gap={7}>
            <PageHeader
              title="Keep the view in step"
              description="Live updates, missed events, and a connection that can recover without losing the page around it."
            />
            <LiveDemo />
          </Flex>
        </Container>
      )}
    </Guard>
  );
}
