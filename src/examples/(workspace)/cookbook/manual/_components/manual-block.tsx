import { A as Link } from "@solidjs/router";
import { For } from "solid-js";
import { Table, TBody, Td, Th, THead, Tr } from "~/components/display";
import { Alert } from "~/components/feedback";
import { Text } from "~/components/typography";
import { assertNever } from "~/lib/kernel";
import type { ManualBlock as Block } from "../_lib/types";
import s from "../manual.module.css";
export function ManualBlock(props: { block: Block }) {
  return (
    <>
      {(() => {
        switch (props.block.kind) {
          case "text":
            return <Text class={s.paragraph}>{props.block.text}</Text>;
          case "list":
            return (
              <ul class={s.list}>
                <For each={props.block.items}>{(item) => <li>{item}</li>}</For>
              </ul>
            );
          case "code":
            return (
              <figure class={s.example}>
                <figcaption>{props.block.label}</figcaption>
                <pre tabindex={0} role="region" aria-label={props.block.label}>
                  <code>{props.block.code}</code>
                </pre>
              </figure>
            );
          case "callout":
            return (
              <Alert tone="info" title={props.block.title}>
                {props.block.text}
              </Alert>
            );
          case "table":
            return (
              <Table caption={props.block.caption} class={s.table}>
                <THead>
                  <Tr>
                    <For each={props.block.headings}>
                      {(heading) => <Th>{heading}</Th>}
                    </For>
                  </Tr>
                </THead>
                <TBody>
                  {
                    <For each={props.block.rows}>
                      {(row) => (
                        <Tr>
                          {
                            <For each={row}>
                              {(value, column) => (
                                <>
                                  {" "}
                                  {column() === 0 ? (
                                    <Th scope="row">{value}</Th>
                                  ) : (
                                    <Td>{value}</Td>
                                  )}{" "}
                                </>
                              )}
                            </For>
                          }
                        </Tr>
                      )}
                    </For>
                  }
                </TBody>
              </Table>
            );
          case "links":
            return (
              <ul class={s.related}>
                <For each={props.block.items}>
                  {(item) => (
                    <li>
                      <Link href={item.href}>{item.label}</Link>
                      <Text size="sm" tone="muted">
                        {item.description}
                      </Text>
                    </li>
                  )}
                </For>
              </ul>
            );
          case "sources":
            return (
              <div class={s.sources}>
                <Text size="sm" weight="medium">
                  Read in the repository
                </Text>
                <ul>
                  <For each={props.block.items}>
                    {(item) => (
                      <li>
                        <code>{item.path}</code>
                        <Text size="sm" tone="muted">
                          {item.why}
                        </Text>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            );
          default:
            return assertNever(props.block);
        }
      })()}
    </>
  );
}
