import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { HttpStatusCode } from "@solidjs/start";
import s from "./[...404].module.css";
export default function NotFound() {
  return (
    <main class={s.page}>
      <Title>Not found</Title>
      {/* The status is set as well as rendered. A 404 page returning 200 is a
          page that tells a person it is missing and tells everything else that
          it is fine. */}
      <HttpStatusCode code={404} />
      <div class={s.body}>
        <p class={s.code}>404</p>
        <h1 class={s.title}>Not found</h1>
        <A href="/" class={s.link}>
          Back
        </A>
      </div>
    </main>
  );
}
