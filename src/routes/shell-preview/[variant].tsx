import { useParams, useSearchParams } from "@solidjs/router";
import { Show } from "solid-js";
import { ShellPreview } from "~/examples/(dev)/shell-preview/_components/shell-preview";
export default function Preview() {
  const params = useParams();
  const [search] = useSearchParams();
  return (
    <Show
      keyed
      when={
        ["standard", "rail", "auth"].includes(params.variant ?? "")
          ? params.variant
          : null
      }
      fallback={<h1>Preview not found</h1>}
    >
      {(variant) => (
        <ShellPreview
          variant={variant as "standard" | "rail" | "auth"}
          section={
            typeof search.section === "string" ? search.section : undefined
          }
          page={typeof search.page === "string" ? search.page : undefined}
        />
      )}
    </Show>
  );
}
