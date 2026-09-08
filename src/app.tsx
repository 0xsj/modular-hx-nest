/* FIRST, above every other import, and load-bearing.
 *
 * `src/styles/layers.css` carries the `@layer reset, token, base, primitive,
 * composition, screen, override;` statement, and a layer order can only order
 * the layers it has not already seen. Imported after a component, that
 * component's `@layer primitive` block reaches the browser first, and the
 * statement then appends reset/token/base BEHIND it — so `button { border:
 * none }` in @layer reset starts beating every button primitive. It reads as a
 * specificity bug in a file that has no specificity problem. */
import "~/styles/index.css";

import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";

/* No chrome here, deliberately. The scaffold's inline nav was three links in
 * the root layout, which is a shell — and a shell belongs beside the routes it
 * frames rather than around every route in the tree. Each screen owns its own
 * furniture until something needs to share it. */
export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>flover</Title>
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
