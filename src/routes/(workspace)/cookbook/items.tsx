import { Title } from "@solidjs/meta";
import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { ItemWorkspace } from "~/examples/(workspace)/cookbook/(recipes)/items/workspace";
import { Guard } from "~/lib/app/guard";
export default function Page() {
  return (
    <Guard>
      {(user) => (
        <Container width="page">
          <Title>From a list to a saved change · cookbook</Title>
          <Flex direction="column" gap={7}>
            <PageHeader
              title="From a list to a saved change"
              description="Browse an item, edit its details, and follow the save through success or recovery. Your view has an address; your draft has its own lifecycle."
            />
            <ItemWorkspace accountId={user.id} />
          </Flex>
        </Container>
      )}
    </Guard>
  );
}
