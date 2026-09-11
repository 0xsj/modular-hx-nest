import { assertNever, type Failure, type FailureKind } from "~/lib/kernel";

/* Where a Failure stops being a Failure.
 *
 * `Result` is a class, so it does not survive serialisation — returning one
 * from a Server Function compiles and fails at runtime, and
 * `boundaries.test.ts` fails the build for it. This is the plain-data shape it
 * becomes instead, and it is deliberately the ONLY one: a second form-state
 * type invented per screen is how two forms render the same refusal
 * differently.
 *
 * # A UNION, so illegal states are not representable
 *
 * The first version of this file was `{ message?, fields?, retryAfter? }` —
 * every field optional — which allows a state carrying both a form-level
 * message and field-level ones, and a state carrying neither. Neither can
 * happen, and both compiled. Tagging it makes *exactly one of the two renders*
 * a fact the compiler holds rather than a convention two files agreed on, and
 * `fields` becomes REQUIRED on the arm that has it, so a caller never reaches
 * for it optionally.
 *
 * # `scope` is a rendering question, not a restatement of `kind`
 *
 * Today it is derivable — only `invalid` carries per-field messages — and it is
 * still the right tag, because the form is asking *where does this message go*
 * rather than *what kind was it*. Those are different questions that happen to
 * share an answer, and they come apart the first time a screen decides a taken
 * email belongs beside the email input. `signUpAction` does exactly that.
 *
 * # There is no `ok` arm
 *
 * Both actions redirect on success, so an `ok` state would be a modelled state
 * with no caller — which `CLAUDE.md` says is not scaffolding but a state that
 * will be wrong when something finally reaches it. **Add it when a form
 * succeeds without navigating**, which is the first "check your email" screen. */

export type FormState =
  /** Nothing has been submitted. Distinct from *submitted and nothing came
   *  back*, which the previous `{}` could not express. */
  | { status: "idle" }
  /** No field was named, so the message belongs to the whole form.
   *
   *  `kind` rides along because some refusals are not the reader's mistake and
   *  a screen has to say so differently. A rate limit is the case that forces
   *  it: once the budget is spent **a correct password is refused too**, so
   *  "check your details" is advice that cannot work. */
  | {
      status: "error";
      scope: "form";
      message: string;
      kind: FailureKind;
      /** Seconds to wait, when the answer was "not yet" rather than "no". */
      retryAfter?: number;
      values?: Record<string, string>;
    }
  /** At least one field was named. `fields` is REQUIRED here. */
  | {
      status: "error";
      scope: "fields";
      message: string;
      kind: FailureKind;
      fields: Record<string, string>;
      values?: Record<string, string>;
    };

export const IDLE: FormState = { status: "idle" };

export type ToFormStateOptions = {
  /** What was typed, echoed back so a refused submit does not empty the form.
   *
   *  The server returns safe display values after a refused action. Enhanced
   *  SvelteKit forms keep their current input; ordinary submissions can restore
   *  these values after navigation.
   *
   *  Never a password. */
  values?: Record<string, string>;
  /** Put a failure that names no field beside one anyway.
   *
   *  The reason `scope` is the tag rather than `kind`: a taken email is a
   *  `conflict` — the form was well-formed and the world disagreed with it —
   *  and it still belongs on the email input, because that is the field the
   *  reader has to change. Placement is the screen's decision; the kind is
   *  not. */
  fieldFor?: (failure: Failure) => string | undefined;
};

/** Every kind, spelled out, so adding one to the union breaks here rather than
 *  falling through to a generic apology. */
export function toFormState(
  failure: Failure,
  options: ToFormStateOptions = {},
): FormState {
  const base = {
    status: "error",
    kind: failure.kind,
    values: options.values,
  } as const;

  /* `invalid` is the one kind the union gives `fields`, so no guard is needed
     on this branch — reading it is a type error anywhere else. */
  if (failure.kind === "invalid") {
    return {
      ...base,
      scope: "fields",
      message: failure.message,
      fields: failure.fields,
    };
  }

  const field = options.fieldFor?.(failure);
  if (field) {
    return {
      ...base,
      scope: "fields",
      message: failure.message,
      fields: { [field]: failure.message },
    };
  }

  switch (failure.kind) {
    case "rate_limited":
      return {
        ...base,
        scope: "form",
        message: failure.message,
        retryAfter: failure.retryAfter,
      };

    case "unauthenticated":
    case "forbidden":
    case "conflict":
    case "not_found":
      /* The reader can do something about all four, and the service wrote a
         sentence for them. Pass it through rather than paraphrasing. */
      return { ...base, scope: "form", message: failure.message };

    case "timeout":
    case "unavailable":
    case "canceled":
    case "internal":
      /* The reader can do nothing about these, and the service's message is
         about the system rather than about them. One sentence, and the
         correlation id is what makes it findable in a log. */
      return {
        ...base,
        scope: "form",
        message: failure.correlationId
          ? `Something went wrong. Reference ${failure.correlationId}.`
          : "Something went wrong. Try again.",
      };

    default:
      return assertNever(failure, "failure kind");
  }
}
