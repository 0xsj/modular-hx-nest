import { Title } from "@solidjs/meta";
import { Container } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { Guard } from "~/lib/app/guard";
export default function AppHome() {
  return (
    <Guard>
      {(_user) => (
        <>
          <Title>Home · flover-solid</Title>
          <Container width="page">
            <PageHeader title="Home" />
          </Container>
        </>
      )}
    </Guard>
  );
}
