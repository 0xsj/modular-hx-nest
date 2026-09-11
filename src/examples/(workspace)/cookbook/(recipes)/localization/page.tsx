import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { LocalizationDemo } from "./localization-demo";
export default function Page() {
  return (
    <Container width="page">
      <Flex direction="column" gap={8}>
        <PageHeader
          title="Make room for another language"
          description="Keep locale, time zone and currency explicit. Test translated content, missing values, and right-to-left composition before a product depends on them."
        />
        <LocalizationDemo />
      </Flex>
    </Container>
  );
}
