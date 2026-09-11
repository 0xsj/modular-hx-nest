import { createAsync, useLocation } from "@solidjs/router";
import { Show, Suspense } from "solid-js";
import Page from "~/examples/(dev)/probe/page";
import { getProbe } from "~/lib/app/route-data";
export default function Route() {
  const location = useLocation(),
    data = createAsync(() => getProbe(location.search));
  return (
    <Suspense fallback={<p role="status">Loading probe…</p>}>
      <Show keyed when={data()}>
        {(result) => <Page {...result} />}
      </Show>
    </Suspense>
  );
}
