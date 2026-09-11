import type { Component } from "solid-js";
import type { SectionId } from "../_lib/catalog";
import { FormsSection } from "./forms";
import { PickersSection } from "./pickers";
import { CardsSection } from "./cards";
import { DataSection } from "./data";
import { DisplaySection } from "./display";
import { FeedbackSection } from "./feedback";
import { LayoutSection } from "./layout";
import { NavigationSection } from "./navigation";
import { OverlaysSection } from "./overlays";
import { TypeComponentsSection } from "./type-components";
import { UtilitySection } from "./utility";
import { ChromeSection } from "./chrome";
import { ShellsSection } from "./shells";
import { TokensSection } from "./tokens";
import { TypographySection } from "./typography";
import { DisclosureSection } from "./disclosure";
import { TablesSection } from "./tables";
import { ChartsSection } from "./charts";
import { PatternsSection } from "./patterns";
import { StatisticalChartsSection } from "./statistical-charts";
import { NetworksSection } from "./networks";
import { WorkspacesSection } from "./workspaces";

/** Every catalog entry must have a renderer. This module stays server-side. */
export const SECTION_COMPONENTS = {
  tokens: TokensSection,
  typography: TypographySection,
  layout: LayoutSection,
  "type-components": TypeComponentsSection,
  forms: FormsSection,
  pickers: PickersSection,
  cards: CardsSection,
  display: DisplaySection,
  feedback: FeedbackSection,
  navigation: NavigationSection,
  disclosure: DisclosureSection,
  overlays: OverlaysSection,
  utility: UtilitySection,
  tables: TablesSection,
  charts: ChartsSection,
  "statistical-charts": StatisticalChartsSection,
  networks: NetworksSection,
  patterns: PatternsSection,
  shells: ShellsSection,
  workspaces: WorkspacesSection,
  chrome: ChromeSection,
  data: DataSection,
} satisfies Record<SectionId, Component>;
