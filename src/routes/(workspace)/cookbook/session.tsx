import { Title } from "@solidjs/meta";
import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { SessionDemo } from "~/examples/(workspace)/cookbook/(recipes)/session/session-demo";
import { Guard } from "~/lib/app/guard";
export default function Page() {
  return (
    <Guard>
      {(user) => (
        <Container width="page">
          <Title>Pick up where you left off · cookbook</Title>
          <Flex direction="column" gap={7}>
            <PageHeader
              title="Pick up where you left off"
              description="Expire a session while editing or saving. Verify the account, return to the editor, and resolve the original save."
            />
            <SessionDemo accountId={user.id} />
          </Flex>
        </Container>
      )}
    </Guard>
  );
}
