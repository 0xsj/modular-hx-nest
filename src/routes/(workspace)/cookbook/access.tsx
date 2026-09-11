import { Title } from "@solidjs/meta";
import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { AccessDemo } from "~/examples/(workspace)/cookbook/(recipes)/access/access-demo";
import { Guard } from "~/lib/app/guard";
export default function Page() {
  return (
    <Guard>
      {(user) => (
        <Container width="page">
          <Title>Access can change while you work · cookbook</Title>
          <Flex direction="column" gap={7}>
            <PageHeader
              title="Access can change while you work"
              description="Render explicit decisions and their reasons. Refresh stale permissions and handle a server refusal at the affected region."
            />
            <AccessDemo accountId={user.id} />
          </Flex>
        </Container>
      )}
    </Guard>
  );
}
