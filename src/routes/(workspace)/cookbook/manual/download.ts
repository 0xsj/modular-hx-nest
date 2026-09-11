import type { APIEvent } from "@solidjs/start/server";
import { manualMarkdown } from "~/examples/(workspace)/cookbook/manual/_lib/markdown";
export function GET({ request }: APIEvent) {
  return new Response(manualMarkdown(new URL(request.url).origin), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="flover-solid-manual.md"',
    },
  });
}
