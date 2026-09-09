import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

/* A config of its own, not `vite.config.ts`.
 *
 * The app config runs `solidStart()`, which brings a router, a server build and
 * an SSR pipeline that a unit test has no use for and that fights the test
 * transform. `vite-plugin-solid` on its own is the same JSX compiler without
 * the application around it.
 *
 * The alias is repeated rather than shared, because the two configs are read by
 * different tools and a shared file would be a third thing to keep in step for
 * one line. If it grows past one line, extract it. */
export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: { "~": new URL("./src/", import.meta.url).pathname },
    /* Solid ships a server build and a browser build behind export conditions.
       Without `browser` the test imports the SSR build, which renders to a
       string and never touches the DOM — so every query finds nothing and the
       failure reads as a broken component rather than a misconfigured runner. */
    conditions: ["development", "browser"],
  },
  test: {
    environment: "happy-dom",
    globals: true,
    /* CSS Modules are OFF by default in Vitest, and the default returns an
       empty object for `s` — so `s.button` is `undefined`, every class list
       comes out as "undefined undefined", and B3 fails for a reason that has
       nothing to do with the component. Processing them makes the class names
       real. Their TEXT is still never asserted; see button/doc.ts §6. */
    css: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
