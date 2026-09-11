import { Title } from "@solidjs/meta";
import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { DiagnosticsDemo } from "~/examples/(workspace)/cookbook/(recipes)/diagnostics/diagnostics-demo";
import { Guard } from "~/lib/app/guard";
export default function Page() {
  return (
    <Guard>
      {(_user) => (
        <Container width="page">
          <Title>Follow an interaction · cookbook</Title>
          <Flex direction="column" gap={7}>
            <PageHeader
              title="Follow an interaction"
              description="See where an operation succeeds, fails, or recovers. A transport answer and a usable response are two separate steps."
            />
            <DiagnosticsDemo />
          </Flex>
        </Container>
      )}
    </Guard>
  );
}
