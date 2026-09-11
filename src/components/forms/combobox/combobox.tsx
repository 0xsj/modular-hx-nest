import { Combobox as Ark, createListCollection } from "@ark-ui/solid/combobox";
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  Show,
  untrack,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Check, ChevronDown, X } from "~/components/utility";
import { cn } from "~/lib/kernel";
import surface from "../../surface.module.css";
import { bindFormReset } from "../_shared/form-reset";
import { PickerMessages, type PickerFieldProps } from "../_shared/picker-field";
import field from "../_shared/picker.module.css";
import s from "./combobox.module.css";
export type ChoiceOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};
export type ChoiceControlProps = PickerFieldProps & {
  options: readonly ChoiceOption[];
  placeholder?: string;
  name?: string;
  form?: string;
  emptyMessage?: string;
};
export type ComboboxProps = ChoiceControlProps & {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
};
export type MultiChoiceProps = ChoiceControlProps & {
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
};
export function Combobox(props: ComboboxProps) {
  return <ChoicePicker {...props} mode="single" />;
}
export function ChoicePicker(
  props:
    | (ComboboxProps & {
        mode: "single";
      })
    | (MultiChoiceProps & {
        mode: "multiple";
      }),
) {
  const _hintSlot = createMemo(() => props.hint);
  const generated = createUniqueId(),
    id = () => props.id ?? generated;
  const initial = () => {
    const v = props.defaultValue;
    return Array.isArray(v) ? [...v] : typeof v === "string" ? [v] : [];
  };
  const [local, setLocal] = createSignal<string[]>(untrack(initial)),
    [query, setQuery] = createSignal(""),
    [open, setOpen] = createSignal(false);
  let input: HTMLInputElement | undefined, host: HTMLDivElement | undefined;
  const selected = createMemo(() => {
    const v = props.value === undefined ? local() : props.value;
    return Array.isArray(v) ? [...v] : typeof v === "string" ? [v] : [];
  });
  const labelFor = (value: string) =>
    props.options.find((o) => o.value === value)?.label ?? value;
  const matches = createMemo(() =>
    props.options.filter((o) =>
      o.label.toLocaleLowerCase().includes(query().toLocaleLowerCase()),
    ),
  );
  const collection = createMemo(() =>
    createListCollection({
      items: [...matches()],
    }),
  );
  const inputValue = () =>
    props.mode === "single" && !open()
      ? selected().map(labelFor).join("")
      : query();
  const describedBy = () =>
    [props.error ? `${id()}-error` : "", _hintSlot() ? `${id()}-hint` : ""]
      .filter(Boolean)
      .join(" ") || undefined;
  function choose(value: string[]) {
    if (props.disabled || props.readOnly) return;
    setLocal(value);
    if (props.mode === "single") props.onValueChange?.(value[0] ?? null);
    else props.onValueChange?.(value);
    setQuery("");
  }
  createEffect(() => {
    if (input) {
      input.defaultValue =
        props.mode === "single" ? selected().map(labelFor).join("") : "";
      input.setCustomValidity(
        props.required &&
          !props.disabled &&
          !props.readOnly &&
          !selected().length
          ? "Choose an option."
          : "",
      );
    }
  });
  bindFormReset(
    () => host,
    () => {
      if (props.value === undefined) setLocal(initial());
      setQuery("");
      setOpen(false);
      if (input) input.value = inputValue();
    },
    () => props.form,
  );
  return (
    <div ref={host} class={cn(field.field, props.class)}>
      <div class={field.label}>
        <label for={id()}>{props.label}</label>
        {props.required && (
          <span class={field.required} aria-hidden="true">
            *
          </span>
        )}
      </div>
      <Ark.Root
        lazyMount
        unmountOnExit
        collection={collection()}
        multiple={props.mode === "multiple"}
        value={selected()}
        onValueChange={(d) => choose(d.value)}
        onInputValueChange={(d) => {
          setQuery(d.inputValue);
        }}
        onOpenChange={(d) => {
          setOpen(d.open);
          if (!d.open) {
            setQuery("");
            const display = inputValue();
            queueMicrotask(() => {
              if (input) input.value = display;
            });
          }
        }}
        disabled={props.disabled}
        readOnly={props.readOnly}
        closeOnSelect={props.mode === "single"}
        selectionBehavior={props.mode === "single" ? "replace" : "clear"}
        positioning={{
          placement: "bottom-start",
          gutter: 6,
        }}
        ids={{
          input: id(),
        }}
      >
        <Ark.Control class={field.control}>
          <Ark.Input
            ref={input}
            class={s.input}
            placeholder={props.placeholder ?? "Search options…"}
            aria-describedby={describedBy()}
            aria-invalid={Boolean(props.error) || undefined}
            required={props.required}
            form={props.form}
          />
          {props.mode === "single" &&
            selected().length > 0 &&
            !props.disabled &&
            !props.readOnly && (
              <button
                type="button"
                class={field.iconButton}
                aria-label={`Clear ${props.label}`}
                onClick={() => choose([])}
              >
                <X size={13} aria-hidden="true" />
              </button>
            )}
          <Ark.Trigger
            class={field.iconButton}
            aria-label={`Show options for ${props.label}`}
            disabled={props.disabled || props.readOnly}
          >
            <ChevronDown size={14} aria-hidden="true" />
          </Ark.Trigger>
        </Ark.Control>
        <Portal>
          <Ark.Positioner
            style={{
              "z-index": "var(--z-popover,60)",
            }}
          >
            <Ark.Content
              class={cn(surface.elevated, field.popover, s.popover)}
              aria-label={props.label}
            >
              <Ark.List class={s.list}>
                <For
                  each={matches()}
                  fallback={
                    <p class={s.empty}>
                      {props.emptyMessage ??
                        (props.options.length
                          ? "No matching options."
                          : "No options available.")}
                    </p>
                  }
                >
                  {(option) => (
                    <Ark.Item item={option} class={s.option}>
                      <Ark.ItemText class={s.optionText}>
                        <span>{option.label}</span>
                        {option.description && (
                          <span class={s.description}>
                            {option.description}
                          </span>
                        )}
                      </Ark.ItemText>
                      <Check
                        size={14}
                        aria-hidden="true"
                        style={{
                          visibility: selected().includes(option.value)
                            ? "visible"
                            : "hidden",
                        }}
                      />
                    </Ark.Item>
                  )}
                </For>
              </Ark.List>
            </Ark.Content>
          </Ark.Positioner>
        </Portal>
      </Ark.Root>
      <Show when={props.mode === "multiple" && selected().length > 0}>
        <div class={s.tags} role="grid" aria-label={`Selected ${props.label}`}>
          <For each={selected()}>
            {(key) => (
              <div
                class={s.tag}
                role="row"
                tabindex={props.disabled || props.readOnly ? -1 : 0}
                aria-label={labelFor(key)}
                onKeyDown={(event) => {
                  if (props.disabled || props.readOnly) return;
                  if (["Delete", "Backspace"].includes(event.key)) {
                    event.preventDefault();
                    const next =
                      event.currentTarget.nextElementSibling ??
                      event.currentTarget.previousElementSibling;
                    choose(selected().filter((v) => v !== key));
                    if (next instanceof HTMLElement) next.focus();
                    else input?.focus();
                  }
                  if (["ArrowLeft", "ArrowRight"].includes(event.key)) {
                    event.preventDefault();
                    const next =
                      event.key === "ArrowRight"
                        ? event.currentTarget.nextElementSibling
                        : event.currentTarget.previousElementSibling;
                    if (next instanceof HTMLElement) next.focus();
                  }
                }}
              >
                <div role="gridcell">
                  <span>{labelFor(key)}</span>
                  {!props.disabled && !props.readOnly && (
                    <button
                      type="button"
                      class={s.remove}
                      aria-label={`Remove ${labelFor(key)}`}
                      onClick={() =>
                        choose(selected().filter((v) => v !== key))
                      }
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
      <Show when={props.name}>
        <For each={selected()}>
          {(value) => (
            <input
              type="hidden"
              name={props.name}
              value={value}
              form={props.form}
              disabled={props.disabled}
            />
          )}
        </For>
      </Show>
      <PickerMessages id={id()} error={props.error} hint={_hintSlot()} />
    </div>
  );
}
