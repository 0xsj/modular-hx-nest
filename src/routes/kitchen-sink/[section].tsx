import { Title } from "@solidjs/meta";
import { useParams } from "@solidjs/router";
import { HttpStatusCode } from "@solidjs/start";
import { Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { CATALOG } from "~/examples/(dev)/kitchen-sink/_lib/catalog";
import { SECTION_COMPONENTS } from "~/examples/(dev)/kitchen-sink/_sections/registry";
export default function Category() {
  const params = useParams();
  const entry = () => CATALOG.find((e) => e.id === params.section);
  return (
    <Show
      keyed
      when={entry()}
      fallback={
        <>
          <HttpStatusCode code={404} />
          <h1>Category not found</h1>
        </>
      }
    >
      {(category) => (
        <>
          <Title>{category.label} · Flover kitchen sink</Title>
          <Dynamic component={SECTION_COMPONENTS[category.id]} />
        </>
      )}
    </Show>
  );
}
