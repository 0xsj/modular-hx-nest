import { useParams } from "@solidjs/router";
import { HttpStatusCode } from "@solidjs/start";
import { Show } from "solid-js";
import Page from "~/examples/(workspace)/cookbook/manual/[chapter]/page";
import { findChapter } from "~/examples/(workspace)/cookbook/manual/_lib/chapters";
export default function Route() {
  const params = useParams();
  return (
    <Show
      keyed
      when={findChapter(params.chapter ?? "")}
      fallback={
        <>
          <HttpStatusCode code={404} />
          <h1>Chapter not found</h1>
        </>
      }
    >
      {(chapter) => <Page chapter={chapter} />}
    </Show>
  );
}
