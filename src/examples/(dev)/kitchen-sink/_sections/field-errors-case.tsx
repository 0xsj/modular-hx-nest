import { Field, Input } from "~/components/forms";
import { invalid } from "~/lib/kernel";
import { Case } from "../_components/section";
import s from "../_components/sink.module.css";

/** A seam case: the transport tier's vocabulary arriving in a component. */
export function FieldErrorsCase() {
  /* Exactly what a service returns when it refuses a write — the one kind that
     carries per-field messages. Nothing here invents a shape. */
  const failure = invalid("Check the form.", {
    name: "A name is required.",
    host: "Internal hosts cannot be targeted.",
  });
  const fieldOf = (k: string) =>
    failure.kind === "invalid" ? failure.fields[k] : undefined;
  return (
    <Case
      title="A failure becomes field errors"
      note="invalid.fields, rendered"
    >
      <div class={s.fieldGrid}>
        <Field label="Name" error={fieldOf("name")} required>
          {(control) => <Input {...control} />}
        </Field>
        <Field label="Host" error={fieldOf("host")} required>
          {(control) => <Input {...control} value="db.internal" />}
        </Field>
      </div>

      <p class={s.limits}>
        <code>fields</code> exists on the <code>invalid</code> kind and on no
        other, so reading it needs no optional chaining and no guard — the union
        says it is there on that branch. A form renders{" "}
        <strong>one branch</strong> whether the refusal came from the client or
        the server, because a service produces the same shape either way.
      </p>
    </Case>
  );
}
