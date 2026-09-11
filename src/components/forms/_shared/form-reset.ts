import { createEffect, onCleanup } from "solid-js";
/** Bind once the owning element exists; external form ids are supported. */
export function bindFormReset(
  element: () => HTMLElement | undefined,
  reset: () => void,
  formId: () => string | undefined = () => undefined,
) {
  createEffect(() => {
    const node = element(),
      id = formId();
    const form = id ? document.getElementById(id) : node?.closest("form");
    if (!(form instanceof HTMLFormElement)) return;
    let pending: ReturnType<typeof setTimeout> | undefined;
    const handle = (event: Event) => {
      clearTimeout(pending);
      // A browser-dispatched reset can flush microtasks before its default action.
      // The next task runs after native fields have actually been reset.
      pending = setTimeout(() => {
        if (!event.defaultPrevented) reset();
      }, 0);
    };
    form.addEventListener("reset", handle);
    onCleanup(() => {
      clearTimeout(pending);
      form.removeEventListener("reset", handle);
    });
  });
}
