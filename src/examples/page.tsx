import { A as Link } from "@solidjs/router";
import { Button } from "~/components/forms";
import { Container, Flex } from "~/components/layout";
import { Heading, Text } from "~/components/typography";
import { ArrowUpRight } from "~/components/utility";
import s from "./page.module.css";
export default function Home() {
  return (
    <main class={s.landing}>
      <Container width="measure" class={s.content}>
        <Text size="sm" tone="muted" class={s.eyebrow}>
          SolidStart template
        </Text>
        <Heading level={1} size="xl" class={s.title}>
          flover-solid
        </Heading>
        <Text size="lg" tone="muted" class={s.description}>
          An opinionated starter with a composable design system, clear layers,
          and thoughtful error handling. A foundation for your next product.
        </Text>
        <nav aria-label="Start exploring" class={s.navigation}>
          <Flex gap={4} wrap class={s.actions}>
            <Button
              asChild={(forwarded) => (
                <Link {...forwarded()} href="/kitchen-sink">
                  Explore the kitchen sink{" "}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              )}
              intent="primary"
              size="lg"
            />
            <Button
              asChild={(forwarded) => (
                <Link {...forwarded()} href="/cookbook">
                  Browse the cookbook
                </Link>
              )}
              size="lg"
            />
          </Flex>
          <Link href="/cookbook/manual" class={s.manual}>
            Read the user manual
          </Link>
        </nav>
      </Container>
    </main>
  );
}
