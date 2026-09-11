import {
  createAsync,
  Navigate,
  revalidate,
  useLocation,
} from "@solidjs/router";
import type { JSX } from "solid-js";
import { createMemo, Show, Suspense } from "solid-js";
import { ErrorSurface } from "~/components/feedback";
import type { User } from "../services/session";
import { authHref } from "./return-to";
import { getSession } from "./session";
/** A new account owns new models; a same-account refresh preserves existing drafts. */
export function Guard(props: { children: (user: User) => JSX.Element }) {
  const location = useLocation();
  const session = createAsync(() => getSession(location.search));
  const user = createMemo(() => {
    const state = session();
    return state?.state === "found" ? state.value : undefined;
  });
  const failure = createMemo(() => {
    const state = session();
    return state?.state === "unmeasured" ? state.failure : undefined;
  });
  return (
    <Suspense fallback={<p role="status">Verifying your session…</p>}>
      <Show when={session()?.state === "empty"}>
        <Navigate
          href={authHref("/sign-in", `${location.pathname}${location.search}`)}
        />
      </Show>
      <Show when={failure()}>
        {(problem) => (
          <ErrorSurface
            title="Your session could not be verified"
            failure={problem()}
            onRetry={() => void revalidate(getSession.key)}
          />
        )}
      </Show>
      <Show keyed when={user()?.id}>
        {(_accountId) => props.children(user()!)}
      </Show>
    </Suspense>
  );
}
