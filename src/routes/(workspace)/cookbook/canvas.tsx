import { Title } from "@solidjs/meta";
import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { CanvasWorkspace } from "~/examples/(workspace)/cookbook/(recipes)/canvas/workspace";
import { Guard } from "~/lib/app/guard";
export default function Page() {
  return (
    <Guard>
      {(_user) => (
        <Container width="page">
          <Title>A little room to think · cookbook</Title>
          <Flex direction="column" gap={7}>
            <PageHeader
              title="A little room to think"
              description="Move between ideas, arrange the pieces, and explore their connections on an open canvas."
            />
            <CanvasWorkspace />
          </Flex>
        </Container>
      )}
    </Guard>
  );
}
