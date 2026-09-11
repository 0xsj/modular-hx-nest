import { DensityToggle, Mark, MARK, ThemeToggle } from "~/components/chrome";
import { Button, Input } from "~/components/forms";
import { Box, Flex } from "~/components/layout";
import { RUNTIME_BOOT_SCRIPT } from "~/lib/runtime";
import { Case, Row, Section } from "../_components/section";
import s from "../_components/sink.module.css";
export function ChromeSection() {
  return (
    <Section
      id="chrome"
      title="Chrome"
      blurb="The shell around a screen, and the only group that renders state no server has an opinion about. These three are the callers lib/runtime was built for — and the controls in this page's header are these components, not a copy of them."
    >
      <Case title="ThemeToggle" note="three states, and system is one of them">
        <Row label="control">
          <ThemeToggle />
        </Row>
        <p class={s.limits}>
          <strong>Three, not two.</strong> Follow the operating system is a
          choice and not the absence of one: a user who picked it wants the page
          to change when their OS does, and a user who picked <code>light</code>{" "}
          wants it not to. A switch cannot hold that difference and there is no
          way to recover it afterwards.
        </p>
        <p class={s.limits}>
          <code>system</code> is expressed by <strong>removing</strong>{" "}
          <code>data-theme</code>, so the media query in the token layer takes
          over. Setting <code>data-theme=&quot;system&quot;</code> would match
          nothing and silently pin light — which is why the semantic tokens are
          stated twice, once under the query and once under the attribute.
        </p>
        <p class={s.limits}>
          It is a <code>radiogroup</code>, not three buttons carrying{" "}
          <code>aria-pressed</code>. Three of those announce three independent
          on/off states when the truth is one choice with three answers — one
          Tab stop rather than three, and a reader told how many decisions are
          in front of them.
        </p>
      </Case>

      <Case
        title="DensityToggle"
        note="a token override, and this page is where it shows"
      >
        <Row label="control">
          <DensityToggle />
        </Row>
        <Row label="what moves">
          <Flex gap={4} align="center">
            <Button size="sm">Small</Button>
            <Button>Medium</Button>
            <Input placeholder="Control height" class={s.selectWidth} />
          </Flex>
        </Row>
        <p class={s.limits}>
          Switching it redefines three control heights under{" "}
          <code>[data-density=&quot;compact&quot;]</code>, and every component
          reading <code>--control-md</code> follows for free. That makes it a
          review tool as much as a preference:{" "}
          <strong>
            a component that hard-coded a height is visibly wrong the moment
            this is switched
          </strong>
          , and this page is where you would see it.
        </p>
        <p class={s.limits}>
          Per browser, never per account. Nothing stores it on a server, and a
          screen that offers the choice should say so rather than imply a column
          that does not exist.
        </p>
      </Case>

      <Case
        title="Mark"
        note="the element is the caller's fact; the spelling is not"
      >
        <Row label="inline">
          <Mark />
        </Row>
        <Row label="display">
          <Box>
            <Mark as="h2" size="display" />
          </Box>
        </Row>
        <p class={s.limits}>
          On a landing page the wordmark <strong>is</strong> the page&rsquo;s
          heading; in a header beside a navigation it is a lockup, and a heading
          there would be a lie. So <code>as</code> is a prop and the element is
          the caller&rsquo;s decision — a component that hard-codes{" "}
          <code>h1</code> gives a document two of them or none, and nothing in a
          visual review shows which.
        </p>
        <p class={s.limits}>
          It is the one place this system uses <code>as</code> rather than{" "}
          <code>asChild</code>. The content is what the component is for —{" "}
          <code>{MARK}</code>, spelled once — and <code>asChild</code> would
          mean writing it at every call site, which is the duplication this
          ends. The two rules it replaced lived in two route stylesheets.
        </p>
      </Case>

      <Case
        title="The flash, and the one script that runs first"
        note="not fixable inside a component"
      >
        <p class={s.limits}>
          A stored preference read after mount costs a frame — the light first
          paint, then the jump — and it is the most visible bug a theme control
          can have. By the time <code>ThemeToggle</code> mounts the page has
          already been painted, so nothing in this group can prevent it.
        </p>
        <p class={s.limits}>
          This is a blocking inline script in the root layout: the only code in
          the app that runs ahead of the bundle, which is why it is a{" "}
          <strong>string</strong> rather than a module. Both defaults are the
          absence of an attribute, so it only ever writes the two non-default
          values and never has to remove one.
        </p>
        <pre class={s.codeBlock}>
          <code>{RUNTIME_BOOT_SCRIPT}</code>
        </pre>
        <p class={s.limits}>
          It has a second cost, and it is the one that looks like a bug: the
          document now disagrees with what the server sent, so React reports a
          hydration mismatch on <code>&lt;html&gt;</code>. The attributes are
          right and the comparison is what is wrong, so the root layout opts{" "}
          <strong>that one element</strong> out of it —{" "}
          <code>suppressHydrationWarning</code> is one level deep, and a
          suppression that reached children would hide real mismatches for the
          life of the project.
        </p>
        <p class={s.limits}>
          It restates what <code>theme.ts</code> and <code>density.ts</code>{" "}
          already know, and cannot not — the point is to run without them.
          Duplication that cannot be removed can still be made loud:{" "}
          <code>boot.test.ts</code> runs this script and the module path against
          the same storage and requires the same DOM out of both.
        </p>
      </Case>
    </Section>
  );
}
