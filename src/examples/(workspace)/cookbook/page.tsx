import { A as Link } from "@solidjs/router";
import { For } from "solid-js";
import {
  Card,
  CardDescription,
  CardHeader,
  CardLink,
  CardTitle,
} from "~/components/display";
import { Button } from "~/components/forms";
import { Container, Flex } from "~/components/layout";
import { PageHeader } from "~/components/patterns";
import { Text } from "~/components/typography";
import { RECIPES } from "../_lib/navigation";
import s from "./page.module.css";
export default function CookbookPage() {
  return (
    <Container width="page">
      <Flex direction="column" gap={9}>
        <PageHeader
          title="Cookbook"
          description="Working examples for your next application. Explore a complete flow, then bring the pieces you need into your own workspace."
          actions={
            <Button
              asChild={(forwarded) => (
                <Link {...forwarded()} href="/app">
                  Open your app
                </Link>
              )}
              intent="secondary"
            />
          }
        />
        <Card>
          <CardHeader>
            <CardTitle level={2}>
              <CardLink
                asChild={(forwarded) => (
                  <Link {...forwarded()} href="/cookbook/manual">
                    Understand the architecture
                  </Link>
                )}
              />
            </CardTitle>
            <CardDescription>
              The user manual explains the layers, Result and Failure model,
              backend adapters, and the path from a behavior contract to a
              working feature. Start here before adopting a recipe.
            </CardDescription>
          </CardHeader>
        </Card>
        <div class={s.grid}>
          <For each={RECIPES}>
            {({ href, label, description, icon: Icon, category }) => (
              <Card>
                <CardHeader leading={<Icon size={20} aria-hidden="true" />}>
                  <Text as="span" size="sm" tone="muted">
                    {category}
                  </Text>
                  <CardTitle level={2}>
                    <CardLink
                      asChild={(forwarded) => (
                        <Link {...forwarded()} href={href}>
                          {label}
                        </Link>
                      )}
                    />
                  </CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            )}
          </For>
        </div>
        <div class={s.footer}>
          <Text size="sm" tone="muted">
            The working examples use a signed-in session. You can sign in with
            the supplied demo account.
          </Text>
          <Text size="sm">
            <Link href="/kitchen-sink">Browse individual components</Link>
          </Text>
        </div>
      </Flex>
    </Container>
  );
}
