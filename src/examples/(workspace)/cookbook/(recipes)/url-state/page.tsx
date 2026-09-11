import { Suspense } from "solid-js";
import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { Text } from "~/components/typography";
import { CollectionDemo } from "./collection-demo";
export default function UrlStatePage() {
  return (
    <Container width="page">
      <Flex direction="column" gap={8}>
        <PageHeader
          title="Make the view shareable"
          description="Search, filter, sort, and switch views. The address holds the committed state, so a shared link and the back button bring you to the same place."
        />
        <Suspense fallback={<Text>Reading the view from its address…</Text>}>
          <CollectionDemo />
        </Suspense>
      </Flex>
    </Container>
  );
}
