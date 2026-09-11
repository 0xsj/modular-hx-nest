import { Title } from "@solidjs/meta";
import { A, useLocation, useSubmission } from "@solidjs/router";
import { createMemo } from "solid-js";
import { Alert } from "~/components/feedback";
import { Button, Field, Input } from "~/components/forms";
import { Flex } from "~/components/layout";
import { AuthShell } from "~/components/shells";
import { Text } from "~/components/typography";
import { authenticate } from "~/lib/app/session";
import { authHref, safeReturnTo } from "./return-to";
export function AuthForm(props: { mode: "in" | "up" }) {
  const location = useLocation(),
    submission = useSubmission(authenticate);
  const title = () =>
    props.mode === "in" ? "Welcome back" : "Create your account";
  const fields = createMemo(() => {
    const result = submission.result;
    return result?.status === "error" && result.scope === "fields"
      ? result.fields
      : {};
  });
  return (
    <>
      <Title>{title()} · flover-solid</Title>
      <AuthShell
        title={title()}
        description={
          props.mode === "in"
            ? "Sign in to your workspace."
            : "A new workspace starts here."
        }
      >
        <form action={authenticate.with(props.mode)} method="post">
          <input
            type="hidden"
            name="returnTo"
            value={safeReturnTo(
              new URLSearchParams(location.search).get("returnTo"),
            )}
          />
          <input type="hidden" name="search" value={location.search} />
          <Flex direction="column" gap={6}>
            {submission.result?.status === "error" && (
              <Alert tone="crit" title="Unable to continue" live="assertive">
                {submission.result.message}
              </Alert>
            )}
            {props.mode === "up" && (
              <Field label="Name" required error={fields().name}>
                {(control) => (
                  <Input {...control} name="name" autocomplete="name" />
                )}
              </Field>
            )}
            <Field label="Email" required error={fields().email}>
              {(control) => (
                <Input
                  {...control}
                  name="email"
                  type="email"
                  autocomplete="email"
                />
              )}
            </Field>
            <Field label="Password" required error={fields().password}>
              {(control) => (
                <Input
                  {...control}
                  name="password"
                  type="password"
                  autocomplete={
                    props.mode === "in" ? "current-password" : "new-password"
                  }
                />
              )}
            </Field>
            <Button type="submit" intent="primary" loading={submission.pending}>
              {props.mode === "in" ? "Sign in" : "Create account"}
            </Button>
            <Text size="sm" tone="muted">
              Demo account: ada@example.com · password: password
            </Text>
            <Text size="sm">
              <A
                href={authHref(
                  props.mode === "in" ? "/sign-up" : "/sign-in",
                  new URLSearchParams(location.search).get("returnTo"),
                )}
              >
                {props.mode === "in"
                  ? "Create an account"
                  : "Already have an account? Sign in"}
              </A>
            </Text>
          </Flex>
        </form>
      </AuthShell>
    </>
  );
}
