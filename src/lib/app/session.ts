import { query, action, redirect } from "@solidjs/router";
import {
  currentSession,
  serverRoot,
  startSession,
  endSession,
} from "../server/root";
import { signIn, signUp, signOut } from "../services/session";
import { toFormState } from "~/lib/app/form-state";
import { safeReturnTo } from "~/lib/app/return-to";
export const getSession = query(async (search: string) => {
  "use server";
  return currentSession(search);
}, "flover-session");
export const authenticate = action(
  async (mode: "in" | "up", form: FormData) => {
    "use server";
    const text = (key: string) =>
      typeof form.get(key) === "string" ? String(form.get(key)) : "";
    const email = text("email"),
      name = text("name"),
      password = text("password");
    const client = serverRoot(text("search")).clientFor("session");
    const result =
      mode === "in"
        ? await signIn(client, { email, password })
        : await signUp(client, { email, name, password });
    if (!result.ok)
      return toFormState(result.error, {
        values: mode === "in" ? { email } : { email, name },
        fieldFor: (f) =>
          mode === "up" && f.kind === "conflict" ? "email" : undefined,
      });
    startSession(result.value.token);
    throw redirect(safeReturnTo(form.get("returnTo")));
  },
  "flover-authenticate",
);
export const signOutAction = action(async () => {
  "use server";
  await signOut(serverRoot().clientFor("session"));
  endSession();
  throw redirect("/");
}, "flover-sign-out");
