import { Title } from "@solidjs/meta";
import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { LocalizationDemo } from "~/examples/(workspace)/cookbook/(recipes)/localization/localization-demo";
import { Guard } from "~/lib/app/guard";
export default function Page() {
  return (
    <Guard>
      {(_user) => (
        <Container width="page">
          <Title>Make room for another language · cookbook</Title>
          <Flex direction="column" gap={7}>
            <PageHeader
              title="Make room for another language"
              description="Keep locale, time zone and currency explicit. Test translated content, missing values, and right-to-left composition before a product depends on them."
            />
            <LocalizationDemo />
          </Flex>
        </Container>
      )}
    </Guard>
  );
}
