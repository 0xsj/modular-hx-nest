import { defineConfig } from "vite";
import { nitro } from "nitro/vite";

import { solidStart } from "@solidjs/start/config";

export default defineConfig({
  optimizeDeps: {
    include: ["source-map-js", "@solidjs/start > error-stack-parser"],
  },
  server: {
    /* 3001, because the default 3000 is what a sibling of this template runs
       on and two of them are often up at once. */
    port: 3001,
    /* The half that matters. Without it a taken port is not an error: the
       server shifts to the next free one and says so in a single line above
       the banner, so the address you open is still 3001 and belongs to
       something else. Failing here costs a restart; the silent version costs
       an afternoon of debugging the wrong application. */
    strictPort: true,
  },
  plugins: [solidStart(), nitro()],
});
