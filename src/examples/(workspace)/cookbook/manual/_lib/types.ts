export type ManualBlock =
  | { kind: "text"; text: string }
  | { kind: "list"; items: string[] }
  | {
      kind: "code";
      label: string;
      language: "ts" | "tsx" | "sh" | "text";
      code: string;
    }
  | { kind: "table"; caption: string; headings: string[]; rows: string[][] }
  | { kind: "callout"; title: string; text: string }
  | {
      kind: "links";
      items: { href: string; label: string; description: string }[];
    }
  | { kind: "sources"; items: { path: string; why: string }[] };
export type ManualSection = {
  id: string;
  title: string;
  blocks: ManualBlock[];
};
export type ManualChapter = {
  slug: string;
  title: string;
  description: string;
  sections: ManualSection[];
};
