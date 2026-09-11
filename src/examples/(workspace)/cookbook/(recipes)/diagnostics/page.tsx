import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { DiagnosticsDemo } from "./diagnostics-demo";
export default function DiagnosticsPage() {
  return (
    <Container width="page">
      <Flex direction="column" gap={8}>
        <PageHeader
          title="Follow an interaction"
          description="See where an operation succeeds, fails, or recovers. A transport answer and a usable response are two separate steps."
        />
        <DiagnosticsDemo />
      </Flex>
    </Container>
  );
}
