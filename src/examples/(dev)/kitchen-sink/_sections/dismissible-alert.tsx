import { createSignal } from "solid-js";
import { Alert } from "~/components/feedback";
import { Button } from "~/components/forms";

/** A dismissible alert needs a CLIENT boundary, because a function prop cannot
 *  cross the server one — the same rule the button's contract is built around,
 *  and the reason no primitive here manufactures a handler.
 *
 *  This file exists because the section around it is a server component and
 *  passing `onDismiss` from there fails the build. That is the framework being
 *  right: the alternative is a component that is silently client-only and takes
 *  every page rendering it with it. */
export function DismissibleAlert() {
  const [shown, setShown] = createSignal(true);
  return (
    <>
      {!shown() ? (
        <Button size="sm" onClick={() => setShown(true)}>
          Bring it back
        </Button>
      ) : (
        <Alert tone="accent" live="polite" onDismiss={() => setShown(false)}>
          Target created.
        </Alert>
      )}
    </>
  );
}
