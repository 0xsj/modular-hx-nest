import { createAsync, useLocation } from "@solidjs/router";
import { Show, Suspense } from "solid-js";
import { ErrorSurface } from "~/components/feedback";
import Page from "~/examples/(workspace)/cookbook/(recipes)/failures/page";
import { getFailureExample } from "~/lib/app/route-data";
export default function Route() {
  const location = useLocation(),
    data = createAsync(() => getFailureExample(location.search));
  return (
    <Suspense fallback={<p role="status">Loading example…</p>}>
      <Show keyed when={data()}>
        {(result) =>
          result.state === "failed" ? (
            <ErrorSurface
              failure={result.failure}
              onRetry={() => window.location.reload()}
            />
          ) : (
            <Page {...result} />
          )
        }
      </Show>
    </Suspense>
  );
}
