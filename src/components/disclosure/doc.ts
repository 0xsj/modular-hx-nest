/**
 * Disclosure — content a reader chooses to reveal.
 *
 * § CONTRACT
 * Accordion supports one open item or multiple, controlled or uncontrolled.
 * Triggers are buttons inside headings. Enter/Space toggle; arrows move
 * between enabled triggers. Disabled items cannot open. Trigger and content
 * are connected for assistive technology. Callers choose the heading level.
 *
 * § MECHANICS
 * Radix owns state, keyboard behavior, and IDs. The wrapper owns presentation.
 * Content is composed as children, with no data-schema or routing assumption.
 */
export {};
