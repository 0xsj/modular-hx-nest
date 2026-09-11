import { manualMarkdown } from "../_lib/markdown";

export function GET(request: Request) {
  return new Response(manualMarkdown(new URL(request.url).origin), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="flover-manual.md"',
      "X-Content-Type-Options": "nosniff",
    },
  });
}
