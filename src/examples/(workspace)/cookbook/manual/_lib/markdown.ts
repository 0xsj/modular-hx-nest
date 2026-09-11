import { assertNever } from "~/lib/kernel";
import { chapters } from "./chapters";
import type { ManualBlock } from "./types";

const cell = (value: string) =>
  value.replaceAll("|", "\\|").replaceAll("\n", " ");
function blockMarkdown(block: ManualBlock, origin: string): string {
  switch (block.kind) {
    case "text":
      return block.text;
    case "list":
      return block.items.map((item) => `- ${item}`).join("\n");
    case "code":
      return `${block.label}\n\n\`\`\`${block.language}\n${block.code}\n\`\`\``;
    case "callout":
      return `> **${block.title}**\n>\n> ${block.text}`;
    case "table":
      return `${block.caption}\n\n${[block.headings, block.headings.map(() => "---"), ...block.rows].map((row) => `| ${row.map(cell).join(" | ")} |`).join("\n")}`;
    case "links":
      return block.items
        .map(
          (item) =>
            `- [${item.label}](${new URL(item.href, origin).href}) — ${item.description}`,
        )
        .join("\n");
    case "sources":
      return `Repository references:\n\n${block.items.map((item) => `- \`${item.path}\` — ${item.why}`).join("\n")}`;
    default:
      return assertNever(block);
  }
}

/** The download and HTML use the same authored blocks. No repository file is
 * loaded at runtime, and optional protocol contents never become dependencies. */
export function manualMarkdown(origin: string): string {
  return (
    [
      "# Flover user manual",
      "A practical guide to the template's layers, Result/Failure model, adapter contracts and recovery behavior. App links point to the instance that produced this download. Repository references are paths inside a Flover checkout.",
      chapters
        .map(
          (chapter, index) =>
            `${index + 1}. [${chapter.title}](#${chapter.slug})`,
        )
        .join("\n"),
      ...chapters.map((chapter) =>
        [
          `<a id="${chapter.slug}"></a>\n\n## ${chapter.title}`,
          chapter.description,
          ...chapter.sections.map((section) =>
            [
              `### ${section.title}`,
              ...section.blocks.map((block) => blockMarkdown(block, origin)),
            ].join("\n\n"),
          ),
        ].join("\n\n"),
      ),
    ].join("\n\n") + "\n"
  );
}
