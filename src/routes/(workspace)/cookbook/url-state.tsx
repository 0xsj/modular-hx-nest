import { Title } from "@solidjs/meta";
import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { CollectionDemo } from "~/examples/(workspace)/cookbook/(recipes)/url-state/collection-demo";
import { Guard } from "~/lib/app/guard";
export default function Page() {
  return (
    <Guard>
      {(_user) => (
        <Container width="page">
          <Title>Make the view shareable · cookbook</Title>
          <Flex direction="column" gap={7}>
            <PageHeader
              title="Make the view shareable"
              description="Search, filter, sort, and switch views. The address holds the committed state, so a shared link and the back button bring you to the same place."
            />
            <CollectionDemo />
          </Flex>
        </Container>
      )}
    </Guard>
  );
}
