import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { CanvasWorkspace } from "./workspace";
export default function CanvasPage() {
  return (
    <Container>
      <Flex direction="column" gap={8}>
        <PageHeader
          title="A little room to think"
          description="Move between ideas, arrange the pieces, and explore their connections on an open canvas."
        />
        <CanvasWorkspace />
      </Flex>
    </Container>
  );
}
