import { Title } from "@solidjs/meta";
import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { DashboardEditor } from "~/examples/(workspace)/cookbook/(recipes)/editable-dashboard/editor";
import { Guard } from "~/lib/app/guard";
export default function Page() {
  return (
    <Guard>
      {(user) => (
        <Container width="page">
          <Title>Make room for your work · cookbook</Title>
          <Flex direction="column" gap={7}>
            <PageHeader
              title="Make room for your work"
              description="A dashboard you can arrange around what matters. Add widgets, move them, and save your own view."
            />
            <DashboardEditor accountId={user.id} />
          </Flex>
        </Container>
      )}
    </Guard>
  );
}
