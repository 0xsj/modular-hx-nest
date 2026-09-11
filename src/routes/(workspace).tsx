import { A, createAsync, useAction, useLocation } from "@solidjs/router";
import type { JSX } from "solid-js";
import { Show, Suspense, createMemo } from "solid-js";
import { Button } from "~/components/forms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/overlays";
import { LogOut } from "~/components/utility";
import { WorkspaceShell } from "~/examples/(workspace)/_components/workspace-shell";
import { authHref } from "~/lib/app/return-to";
import { getSession, signOutAction } from "~/lib/app/session";
import { QueryProvider } from "~/lib/query";
function Account() {
  const location = useLocation(),
    session = createAsync(() => getSession(location.search)),
    signOut = useAction(signOutAction);
  const user = createMemo(() => {
    const state = session();
    return state?.state === "found" ? state.value : undefined;
  });
  return (
    <Suspense>
      <Show
        when={user()}
        fallback={
          <Button
            asChild={(p) => (
              <A
                {...p()}
                href={authHref(
                  "/sign-in",
                  `${location.pathname}${location.search}`,
                )}
              >
                Sign in
              </A>
            )}
            size="sm"
          />
        }
      >
        {(account) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild={(p) => (
                <Button {...p()} intent="ghost" size="sm">
                  {account().name}
                </Button>
              )}
            />
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{account().email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void signOut()}>
                <LogOut size={14} aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </Show>
    </Suspense>
  );
}
export default function Workspace(props: { children: JSX.Element }) {
  return (
    <QueryProvider>
      <WorkspaceShell account={<Account />}>{props.children}</WorkspaceShell>
    </QueryProvider>
  );
}
