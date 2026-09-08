import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import s from "./index.module.css";

export default function Home() {
  return (
    <main class={s.page}>
      <Title>flover</Title>

      <div class={s.glow} aria-hidden="true" />

      <div class={s.body}>
        <h1 class={s.wordmark}>flover</h1>

        <p class={s.tagline}>
          A starter template. A token layer, a design system, a transport port with a memory
          adapter, and a set of protocols you may adopt or delete.
        </p>

        <A href="/kitchen-sink" class={s.link}>
          Kitchen sink
          <span class={s.arrow} aria-hidden="true">→</span>
        </A>
      </div>

      <p class={s.foot}>Clone it, delete what you do not need.</p>
    </main>
  );
}
