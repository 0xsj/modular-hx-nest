import { A as Link } from "@solidjs/router";
import { Button } from "~/components/forms";
import { usePreviewPreferences } from "../../shell-preview/_components/use-preview-preferences";
import s from "./sink.module.css";
export function ShellExample(props: {
  variant: "standard" | "rail" | "auth";
  title: string;
}) {
  usePreviewPreferences();
  return (
    <>
      <iframe
        class={s.shellPreview}
        src={`/shell-preview/${props.variant}`}
        title={props.title}
        loading="lazy"
      />
      <div>
        <Button
          asChild={(forwarded) => (
            <Link {...forwarded()} href={`/shell-preview/${props.variant}`}>
              Open full-page preview
            </Link>
          )}
          size="sm"
          intent="secondary"
        />
      </div>
    </>
  );
}
