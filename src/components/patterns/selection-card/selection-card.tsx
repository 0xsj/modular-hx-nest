import type { JSX } from "solid-js";
import { createMemo, createUniqueId } from "solid-js";
import { Card, CardBody, CardHeader } from "~/components/display";
import { Checkbox, Radio } from "~/components/forms";
import { cn } from "~/lib/kernel";
import s from "./selection-card.module.css";
type BaseProps = {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
  children?: JSX.Element;
  class?: string;
};
export type SelectionCardProps = BaseProps &
  (
    | {
        mode: "single";
      }
    | {
        mode: "multiple";
        name?: string;
        checked?: boolean;
        defaultChecked?: boolean;
        onCheckedChange?: (checked: boolean) => void;
      }
  );
export function SelectionCard(props: SelectionCardProps) {
  const _descriptionSlot = createMemo(() => props.description);
  const _childrenSlot = createMemo(() => props.children);
  const id = createUniqueId(),
    labelId = `${id}-label`,
    descriptionId = () =>
      _descriptionSlot() ? `${id}-description` : undefined;
  const control = {
    id,
    get value() {
      return props.value;
    },
    get disabled() {
      return props.disabled;
    },
    "aria-labelledby": labelId,
    get "aria-describedby"() {
      return descriptionId();
    },
  };
  return (
    <Card
      as="div"
      class={cn(s.card, props.class)}
      data-disabled={props.disabled ? "" : undefined}
    >
      <CardHeader
        actions={
          props.mode === "single" ? (
            <Radio {...control} />
          ) : (
            <Checkbox
              {...control}
              name={props.name}
              checked={props.checked}
              defaultChecked={props.defaultChecked}
              onCheckedChange={
                props.onCheckedChange
                  ? (checked) => props.onCheckedChange?.(checked === true)
                  : undefined
              }
            />
          )
        }
      >
        <label id={labelId} for={id} class={s.label}>
          {props.label}
        </label>
        {_descriptionSlot() && (
          <p id={descriptionId()} class={s.description}>
            {_descriptionSlot()}
          </p>
        )}
      </CardHeader>
      {_childrenSlot() != null && <CardBody>{_childrenSlot()}</CardBody>}
    </Card>
  );
}
