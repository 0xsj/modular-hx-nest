import type { Component } from "solid-js";
import { FormsSection } from "./forms";
import { InfraSection } from "./infra";
import { TokensSection } from "./tokens";
import { TypographySection } from "./typography";

/* The registry the page composes AND the header nav is built from, so a
 * section cannot exist and be unreachable — and one that is deleted takes its
 * link with it. The rail does the same job for cases, by reading the DOM.
 *
 * One entry per group that has something in it. The other seven groups —
 * display, overlays, navigation, utility, chrome, layout, charts — are empty,
 * and a section listed for an empty group would be a link to nothing, which is
 * the exact failure the derivation above is for.
 *
 * No default export. */
export type Entry = { id: string; label: string; Section: Component };

export const SECTIONS: readonly Entry[] = [
  { id: "tokens", label: "Tokens", Section: TokensSection },
  { id: "typography", label: "Typography", Section: TypographySection },
  { id: "forms", label: "Forms", Section: FormsSection },
  { id: "infra", label: "Infra", Section: InfraSection },
];
