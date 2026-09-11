// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";
import { RUNTIME_BOOT_SCRIPT } from "~/lib/runtime/boot";
import layerOrder from "~/styles/layers.css?inline";
export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.svg" />
          {/* Establish the cascade before Vite injects any component styles. */}
          <style>{layerOrder}</style>
          {/* Static checked-in bootstrap; no request or user text is interpolated. */}
          {/* eslint-disable-next-line solid/no-innerhtml */}
          <script innerHTML={RUNTIME_BOOT_SCRIPT} />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
