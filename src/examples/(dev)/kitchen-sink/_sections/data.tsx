import { Section } from "../_components/section";
import { ChaosCase } from "./chaos-case";
import { FailurePathCase, FailureRenderingCase } from "./failure-case";
import { FieldErrorsCase } from "./field-errors-case";
import { QueryCase } from "./query-case";

/** The path from a status code to a rendered state, and every seam along it.
 *
 *  Cases here belong to two sections at once — a failure rendered as per-field
 *  messages is as much Forms as it is transport — so they live where the
 *  general case lives rather than beside whichever component they happen to
 *  use. Last in the order deliberately: this is reference, and a seam case only
 *  reads once you have seen the component it wires up. */
export function DataSection() {
  return (
    <Section
      id="data"
      title="Data and failures"
      blurb="A failure is a value with a closed set of kinds, so a screen switches over it exhaustively rather than guessing. These cases are where that vocabulary meets a component: how a failure travels, what a component does with one, how to force the branches fixtures hide, and how the cache behaves."
    >
      <FailurePathCase />
      <FailureRenderingCase />
      <FieldErrorsCase />
      <ChaosCase />
      <QueryCase />
    </Section>
  );
}
