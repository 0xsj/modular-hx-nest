import type { Component } from "solid-js";
import { TokensSection } from "./tokens";
import { TypographySection } from "./typography";

/* The registry the page composes AND the header nav is built from, so a
 * section cannot exist and be unreachable — and one that is deleted takes its
 * link with it. The rail does the same job for cases, by reading the DOM.
 *
 * Two entries. The build this is ported from has ten, and the other eight are
 * sections for components — forms, display, overlays, navigation, utility,
 * chrome, layout, charts. None of those components exists here yet, and a
 * section listed for an empty group would be a link to nothing, which is the
 * exact failure the derivation above is for.
 *
 * No default export. */
export type Entry = { id: string; label: string; Section: Component<{ revision: number }> };

export const SECTIONS: readonly Entry[] = [
  { id: "tokens", label: "Tokens", Section: TokensSection },
  { id: "typography", label: "Typography", Section: TypographySection },
];
