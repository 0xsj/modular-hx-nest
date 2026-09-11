import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/disclosure";
import { Case, Section } from "../_components/section";
import { readSources } from "../_lib/source";
export function DisclosureSection() {
  return (
    <Section
      id="disclosure"
      title="Disclosure"
      blurb="Reveal supporting information without losing the context around it. Each trigger is a heading and a button, with state and keyboard movement provided by the primitive."
    >
      <Case
        title="Accordion"
        note="one item open; all items may be closed"
        sources={readSources([
          "disclosure/accordion/accordion.tsx",
          "disclosure/doc.ts",
        ])}
      >
        <Accordion type="single" defaultValue="workspace" collapsible>
          <AccordionItem value="workspace">
            <AccordionTrigger>What belongs in a workspace?</AccordionTrigger>
            <AccordionContent>
              Related projects, their members, and their shared settings. Keep
              the grouping meaningful to the people using it.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="invite">
            <AccordionTrigger>Can I invite collaborators?</AccordionTrigger>
            <AccordionContent>
              Invite people from the members page. Permissions belong to the
              application; this disclosure only presents the explanation.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="unavailable" disabled>
            <AccordionTrigger>
              Organization settings — unavailable
            </AccordionTrigger>
            <AccordionContent>This item cannot be opened.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Case>
      <Case
        title="Multiple disclosures"
        note="independent sections; more than one can stay open"
      >
        <Accordion type="multiple" defaultValue={["format", "retention"]}>
          <AccordionItem value="format">
            <AccordionTrigger>Export format</AccordionTrigger>
            <AccordionContent>
              Exports include column headers and preserve empty values.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="retention">
            <AccordionTrigger>Retention</AccordionTrigger>
            <AccordionContent>
              Retention is configured per workspace. The application supplies
              the policy and its explanation.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Case>
    </Section>
  );
}
