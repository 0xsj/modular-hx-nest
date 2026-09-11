/**
 * Patterns — common arrangements of primitives with caller-owned behavior.
 *
 * § CONTRACT
 * PageHeader composes a required title, optional description, leading context,
 * and actions. The caller chooses heading level. CollectionToolbar arranges
 * search/filter controls, a summary, and actions; each control keeps its own
 * label and state. Neither component fetches, changes routes, or invents an
 * action. They wrap cleanly at narrow widths.
 *
 * § MECHANICS
 * Presentation sits in the composition cascade layer. These are explicit
 * children/slots rather than an application-specific configuration schema.
 */
export {};
