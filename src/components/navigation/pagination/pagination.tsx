import { createMemo, For, mergeProps } from "solid-js";
import { Button } from "~/components/forms";
import { ChevronLeft, ChevronRight } from "~/components/utility";
import { cn } from "~/lib/kernel";
import { pageItems } from "./pages";
import s from "./pagination.module.css";
export type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label?: string;
  class?: string;
};
export function Pagination(incomingProps: PaginationProps) {
  const props = mergeProps(
    {
      label: "Pagination",
    } as const,
    incomingProps,
  );
  const total = createMemo(() =>
    Number.isFinite(props.totalPages)
      ? Math.max(0, Math.floor(props.totalPages))
      : 0,
  );
  const current = createMemo(() =>
    Number.isFinite(props.page)
      ? Math.max(1, Math.min(Math.floor(props.page), total()))
      : 1,
  );
  return (
    <>
      {(() => {
        const _totalSnapshot = total();
        return !(_totalSnapshot <= 1) ? (
          <nav class={cn(s.pagination, props.class)} aria-label={props.label}>
            <Button
              size="sm"
              intent="ghost"
              disabled={current() === 1}
              onClick={() => props.onPageChange?.(current() - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              <span class={s.word}>Previous</span>
            </Button>
            <ol class={s.pages}>
              <For each={pageItems(current(), _totalSnapshot)}>
                {(item) => (
                  <li>
                    {typeof item === "number" ? (
                      <Button
                        size="sm"
                        intent={item === current() ? "secondary" : "ghost"}
                        aria-label={`Page ${item}`}
                        aria-current={item === current() ? "page" : undefined}
                        onClick={() => props.onPageChange?.(item)}
                      >
                        {item}
                      </Button>
                    ) : (
                      <span class={s.gap} aria-hidden="true">
                        …
                      </span>
                    )}
                  </li>
                )}
              </For>
            </ol>
            <Button
              size="sm"
              intent="ghost"
              disabled={current() === _totalSnapshot}
              onClick={() => props.onPageChange?.(current() + 1)}
              aria-label="Next page"
            >
              <span class={s.word}>Next</span>
              <ChevronRight size={14} aria-hidden="true" />
            </Button>
          </nav>
        ) : null;
      })()}
    </>
  );
}
