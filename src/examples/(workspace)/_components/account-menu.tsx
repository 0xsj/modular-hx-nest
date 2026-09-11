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
import type { User } from "~/lib/services/session";
/* A client component, holding a reference to a SERVER action.
 *
 * Worth being precise about, because the two look identical at the call site
 * and only one of them works: a plain event handler cannot be passed from a
 * server component to a client one — it is a function, and functions do not
 * serialise — while a `"use server"` function CAN, because what crosses is a
 * reference the runtime knows how to call, not the function itself.
 *
 * So the menu lives here, where a menu has to live, and the cookie is cleared
 * on the server, where cookies can be cleared. */
export function AccountMenu(props: {
  user: User;
  /** A server action. Wrapped rather than passed straight to `onSelect`, which
   *  would call it with the select event as its first argument. */
  onSignOut: () => void | Promise<void>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild={(forwarded) => (
          <Button {...forwarded()} intent="ghost" size="sm">
            {props.user.name}
          </Button>
        )}
      />

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{props.user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void props.onSignOut?.()}>
          <LogOut size={14} aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
