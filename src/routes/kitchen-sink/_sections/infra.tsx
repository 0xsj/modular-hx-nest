import { Section } from "../_components/section";
import { ChaosCase } from "./chaos-case";
import { FailurePathCase, FailureRenderingCase } from "./failure-case";
import { QueryCase } from "./query-case";

/** Everything between the wire and the screen. Not components, so these are
 *  harnesses and specimens rather than a design system — but a screen's failure
 *  branches are as much a part of it as its buttons, and they are the half
 *  nobody looks at. */
export function InfraSection() {
  return (
    <Section
      id="infra"
      title="Infra"
      blurb="The path from a status code to a rendered state. A failure is a value with a closed set of kinds, so a screen switches over it exhaustively rather than guessing; chaos forces the branches that fixtures hide; and the cache asks the error model whether to retry rather than counting attempts."
    >
      <FailurePathCase />
      <FailureRenderingCase />
      <ChaosCase />
      <QueryCase />
    </Section>
  );
}
