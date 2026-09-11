import { DateInput } from "@ark-ui/solid/date-input";
import { DatePicker as Calendar, parseDate } from "@ark-ui/solid/date-picker";
import { today, type DateValue } from "@internationalized/date";
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  Index,
  Show,
  onCleanup,
  untrack,
} from "solid-js";
import { Portal } from "solid-js/web";
import type { DateRange } from "~/components/forms/date-picker/date-value";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
} from "~/components/utility";
import { cn } from "~/lib/kernel";
import surface from "../../surface.module.css";
import { bindFormReset } from "../_shared/form-reset";
import { PickerMessages } from "../_shared/picker-field";
import field from "../_shared/picker.module.css";
import s from "./date-picker.module.css";
import {
  calendarRange,
  dateConstraints,
  rangeAvailabilityError,
  type DateControlProps,
} from "./date-value";
export type DatePickerProps = DateControlProps & {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  name?: string;
  form?: string;
};
export type DateRangePickerProps = DateControlProps & {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (value: DateRange | null) => void;
  startName?: string;
  endName?: string;
  form?: string;
};
export function DatePicker(props: DatePickerProps) {
  return <CalendarField {...props} range={false} />;
}
type CalendarFieldProps =
  | (DatePickerProps & {
      range: false;
    })
  | (DateRangePickerProps & {
      range: true;
    });
export function CalendarField(props: CalendarFieldProps) {
  const _hintSlot = createMemo(() => props.hint);
  const generated = createUniqueId(),
    id = () => props.id ?? generated;
  const initial = () => {
    const v = props.defaultValue;
    return typeof v === "string" ? [v] : v ? [v.start, v.end] : [];
  };
  const [local, setLocal] = createSignal<string[]>(untrack(initial)),
    [open, setOpen] = createSignal(false),
    [draft, setDraft] = createSignal<string[] | null>(null),
    [invalid, setInvalid] = createSignal<string | null>(null),
    [typed, setTyped] = createSignal<DateValue[] | null>(null),
    [incomplete, setIncomplete] = createSignal(false),
    [inputVersion, setInputVersion] = createSignal(1);
  let host: HTMLDivElement | undefined, trigger: HTMLButtonElement | undefined;
  let restoreFocus = false,
    focusFrame: number | undefined;
  onCleanup(() => {
    if (focusFrame !== undefined) cancelAnimationFrame(focusFrame);
  });
  const values = createMemo(() => {
    const v = props.value;
    if (v === undefined) return local();
    return typeof v === "string" ? [v] : v ? [v.start, v.end] : [];
  });
  const parsed = createMemo(() => values().map((value) => parseDate(value)));
  const constraints = createMemo(() => dateConstraints(props));
  const [focused, setFocused] = createSignal(
    untrack(() => parsed()[0] ?? constraints().minValue ?? today("UTC")),
  );
  const incompleteError = () =>
    incomplete()
      ? props.range
        ? "Complete both dates."
        : "Complete the date."
      : null;
  const error = () => props.error ?? invalid() ?? incompleteError();
  const described = () =>
    [error() ? `${id()}-error` : "", _hintSlot() ? `${id()}-hint` : ""]
      .filter(Boolean)
      .join(" ") || undefined;
  function commit(next: string[]) {
    if (props.disabled || props.readOnly) return;
    setLocal(next);
    setTyped(null);
    setIncomplete(false);
    setInvalid(null);
    if (props.range)
      props.onValueChange?.(
        next.length === 2
          ? {
              start: next[0],
              end: next[1],
            }
          : null,
      );
    else props.onValueChange?.(next[0] ?? null);
  }
  function validation(next: string[]) {
    if (!next.length) return props.required ? "Choose a date." : null;
    if (next.some((value) => !value) || next.length < (props.range ? 2 : 1))
      return "Complete both dates.";
    if (props.range && next[0] > next[1])
      return "The end date must not precede the start date.";
    if (props.minDate && next.some((v) => v < props.minDate!))
      return "The date is earlier than the minimum date.";
    if (props.maxDate && next.some((v) => v > props.maxDate!))
      return "The date is later than the maximum date.";
    if (props.range)
      return rangeAvailabilityError(
        calendarRange({
          start: next[0],
          end: next[1],
        }),
        props.isDateUnavailable,
      );
    return props.isDateUnavailable?.(next[0])
      ? "This date is unavailable."
      : null;
  }
  bindFormReset(
    () => host,
    () => {
      if (props.value === undefined) setLocal(initial());
      setDraft(null);
      setTyped(null);
      setIncomplete(false);
      setInvalid(null);
      setOpen(false);
      // Reset the segmented editor even if the committed date is unchanged.
      setInputVersion((version) => version + 1);
    },
    () => props.form,
  );
  return (
    <div ref={host} class={cn(field.field, props.class)}>
      <Calendar.Root
        lazyMount
        unmountOnExit
        selectionMode={props.range ? "range" : "single"}
        value={(draft() ?? values()).map((value) => parseDate(value))}
        focusedValue={focused()}
        onFocusChange={(d) => setFocused(d.focusedValue)}
        onValueChange={(d) => {
          const next = d.value.map((v) => v.toString());
          if (props.range && next.length < 2) {
            setDraft(next);
            // The first pointer click starts a range but Ark leaves its keyboard
            // anchor at the previous selection. Keep the next Enter on this day.
            if (next[0]) setFocused(parseDate(next[0]));
            return;
          }
          const failure = validation(next);
          if (failure) {
            setInvalid(failure);
            return;
          }
          setDraft(null);
          restoreFocus = true;
          commit(next);
        }}
        open={open()}
        onOpenChange={(d) => {
          setOpen(d.open);
          setDraft(null);
          if (!d.open && restoreFocus) {
            restoreFocus = false;
            focusFrame = requestAnimationFrame(() => {
              if (!open()) trigger?.focus();
            });
          }
          if (d.open) setFocused(parsed()[0] ?? focused());
        }}
        min={constraints().minValue}
        max={constraints().maxValue}
        isDateUnavailable={(date) => {
          if (constraints().isDateUnavailable?.(date)) return true;
          const start = draft()?.[0],
            value = date.toString();
          if (!props.range || !start || !props.isDateUnavailable) return false;
          return !!rangeAvailabilityError(
            calendarRange({
              start: start < value ? start : value,
              end: start < value ? value : start,
            }),
            props.isDateUnavailable,
          );
        }}
        disabled={props.disabled}
        readOnly={props.readOnly}
        locale={props.locale ?? "en-GB"}
        closeOnSelect={true}
        positioning={{
          placement: "bottom-start",
          gutter: 6,
        }}
      >
        <Show keyed when={inputVersion()}>
          {(_version) => (
            <DateInput.Root
              value={typed() ?? parsed()}
              onValueChange={(d) => {
                // Partial segment clears may contain absent values at runtime.
                const next = Array.from(
                  d.value,
                  (value) => value?.toString() ?? "",
                );
                setTyped(d.value);
                const failure = next.every((value) => !value)
                  ? null
                  : validation(next);
                if (next.every((value) => !value) || next.every(Boolean)) {
                  commit(next.every((value) => !value) ? [] : next);
                }
                setInvalid(failure);
              }}
              selectionMode={props.range ? "range" : "single"}
              locale={props.locale ?? "en-GB"}
              granularity="day"
              min={constraints().minValue}
              max={constraints().maxValue}
              disabled={props.disabled}
              readOnly={props.readOnly}
              required={props.required}
              invalid={Boolean(error())}
            >
              <DateInput.Context>
                {(api) => {
                  createEffect(() => {
                    const dates = api().displayValues;
                    const segments = ["year", "month", "day"] as const;
                    const empty = dates.every((date) =>
                      date.isCleared([...segments]),
                    );
                    setIncomplete(
                      !empty &&
                        dates.some((date) => !date.isComplete([...segments])),
                    );
                  });
                  return null;
                }}
              </DateInput.Context>
              <div class={field.label}>
                <DateInput.Label>{props.label}</DateInput.Label>
                {props.required && (
                  <span aria-hidden="true" class={field.required}>
                    *
                  </span>
                )}
              </div>
              <Calendar.Control class={cn(field.control, s.control)}>
                <div class={s.inputs}>
                  <DateInput.Context>
                    {(api) => (
                      <For each={props.range ? [0, 1] : [0]}>
                        {(index) => (
                          <>
                            {index === 1 && (
                              <span class={s.rangeSeparator} aria-hidden="true">
                                –
                              </span>
                            )}
                            <DateInput.SegmentGroup
                              index={index}
                              id={index ? `${id()}-end` : id()}
                              class={s.input}
                              aria-describedby={described()}
                              aria-label={
                                props.range
                                  ? `${index ? "End" : "Start"} ${props.label}`
                                  : props.label
                              }
                            >
                              <Index
                                each={api().getSegments({
                                  index,
                                })}
                              >
                                {(segment) => (
                                  <DateInput.Segment
                                    segment={segment()}
                                    class={s.segment}
                                  >
                                    {segment().text}
                                  </DateInput.Segment>
                                )}
                              </Index>
                            </DateInput.SegmentGroup>
                          </>
                        )}
                      </For>
                    )}
                  </DateInput.Context>
                </div>
                {values().length > 0 && !props.disabled && !props.readOnly && (
                  <button
                    type="button"
                    class={field.iconButton}
                    aria-label={`Clear ${props.label}`}
                    onClick={() => {
                      setDraft(null);
                      commit([]);
                    }}
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                )}
                <Calendar.Trigger
                  ref={trigger}
                  class={field.iconButton}
                  aria-label={`Choose ${props.label}`}
                  disabled={props.disabled || props.readOnly}
                >
                  <CalendarDays size={15} aria-hidden="true" />
                </Calendar.Trigger>
              </Calendar.Control>
              <For each={props.range ? [0, 1] : [0]}>
                {(index) => (
                  <NativeDateValue
                    value={
                      incomplete() || invalid() ? "" : (values()[index] ?? "")
                    }
                    name={
                      props.range
                        ? index
                          ? props.endName
                          : props.startName
                        : props.name
                    }
                    form={props.form}
                    required={props.required}
                    disabled={props.disabled}
                    min={props.minDate}
                    max={props.maxDate}
                    error={
                      incompleteError() ?? invalid() ?? validation(values())
                    }
                    onInvalid={(message) => {
                      setInvalid(message);
                      host
                        ?.querySelector<HTMLElement>("[role=spinbutton]")
                        ?.focus();
                    }}
                  />
                )}
              </For>
            </DateInput.Root>
          )}
        </Show>
        <Portal>
          <Calendar.Positioner
            style={{
              "z-index": "var(--z-popover,60)",
            }}
          >
            <Calendar.Content
              role="dialog"
              on:keydown={{
                capture: true,
                handleEvent: (event) => {
                  if (event.key === "Escape") restoreFocus = true;
                },
              }}
              class={cn(surface.elevated, field.popover, s.popover)}
              aria-label={`Choose ${props.label}`}
            >
              <Calendar.View view="day" class={s.calendar}>
                <Calendar.Context>
                  {(api) => (
                    <>
                      <Calendar.ViewControl class={s.header}>
                        <Calendar.PrevTrigger
                          class={field.iconButton}
                          aria-label="Previous"
                        >
                          <ChevronLeft size={15} />
                        </Calendar.PrevTrigger>
                        <Calendar.RangeText class={s.heading} />
                        <Calendar.NextTrigger
                          class={field.iconButton}
                          aria-label="Next"
                        >
                          <ChevronRight size={15} />
                        </Calendar.NextTrigger>
                      </Calendar.ViewControl>
                      <Calendar.Table class={s.grid}>
                        <Calendar.TableHead>
                          <Calendar.TableRow>
                            <For each={api().weekDays}>
                              {(day) => (
                                <Calendar.TableHeader class={s.weekday}>
                                  {day.short}
                                </Calendar.TableHeader>
                              )}
                            </For>
                          </Calendar.TableRow>
                        </Calendar.TableHead>
                        <Calendar.TableBody>
                          <Index each={api().weeks}>
                            {(week) => (
                              <Calendar.TableRow>
                                <Index each={week()}>
                                  {(day) => (
                                    <Calendar.TableCell value={day()}>
                                      <Calendar.TableCellTrigger class={s.day}>
                                        {day().day}
                                      </Calendar.TableCellTrigger>
                                    </Calendar.TableCell>
                                  )}
                                </Index>
                              </Calendar.TableRow>
                            )}
                          </Index>
                        </Calendar.TableBody>
                      </Calendar.Table>
                    </>
                  )}
                </Calendar.Context>
              </Calendar.View>
              <p class={s.help}>
                {props.range
                  ? "Choose a start and end date."
                  : "Choose a date."}{" "}
                Arrow keys move between days.
              </p>
            </Calendar.Content>
          </Calendar.Positioner>
        </Portal>
      </Calendar.Root>
      <PickerMessages id={id()} error={error()} hint={_hintSlot()} />
    </div>
  );
}
function NativeDateValue(props: {
  value: string;
  name?: string;
  form?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  error: string | null;
  onInvalid: (message: string) => void;
}) {
  let input: HTMLInputElement | undefined;
  createEffect(() =>
    input?.setCustomValidity(props.disabled ? "" : (props.error ?? "")),
  );
  return (
    <input
      ref={input}
      type="date"
      tabindex={-1}
      aria-hidden="true"
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        opacity: 0,
        "pointer-events": "none",
      }}
      name={props.name}
      form={props.form}
      value={props.value}
      required={props.required}
      disabled={props.disabled}
      min={props.min}
      max={props.max}
      onInvalid={(event) => {
        event.preventDefault();
        props.onInvalid(event.currentTarget.validationMessage);
      }}
    />
  );
}
