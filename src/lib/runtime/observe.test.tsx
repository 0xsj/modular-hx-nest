import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal, type Setter } from "solid-js";
import { afterEach, expect, it } from "vitest";
import { observeSource } from "./observe";
afterEach(cleanup);
function source(initial: number) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    server: () => initial,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    write(next: number) {
      value = next;
      for (const listener of listeners) listener();
    },
    count: () => listeners.size,
  };
}
it("rebinds a replaced model and disposes both subscriptions with their owners", () => {
  const first = source(1),
    second = source(8);
  let replace!: Setter<typeof first>;
  function View(props: { model: typeof first }) {
    const value = observeSource(() => props.model);
    return <output>{value()}</output>;
  }
  const view = render(() => {
    const [model, setModel] = createSignal(first);
    replace = setModel;
    return <View model={model()} />;
  });
  expect(first.count()).toBe(1);
  first.write(2);
  expect(screen.getByRole("status").textContent).toBe("2");
  replace(second);
  expect(first.count()).toBe(0);
  expect(second.count()).toBe(1);
  first.write(3);
  expect(screen.getByRole("status").textContent).toBe("8");
  second.write(9);
  expect(screen.getByRole("status").textContent).toBe("9");
  view.unmount();
  expect(second.count()).toBe(0);
});
