import { describe, expect, it } from "vitest";
import { authHref, safeReturnTo } from "./return-to";

describe("authentication destinations", () => {
  it.each([
    "/app",
    "/app/projects/123",
    "/cookbook",
    "/cookbook/activity?search=sign+in&page=2",
    "/cookbook/dashboard#sessions",
  ])("preserves local destination %s", (destination) => {
    expect(safeReturnTo(destination)).toBe(destination);
  });

  it.each([
    undefined,
    null,
    ["/cookbook"],
    "",
    "https://other.example/cookbook",
    "//other.example/cookbook",
    "/\\other.example",
    "/sign-in",
    "/api/auth/sessions",
    "/cookbookish",
    "/app/../../sign-in",
    "/cookbook/%2f%2fother.example",
    "/cookbook/%5cother.example",
    "/cookbook/%00bad",
    "/cookbook/%ZZ",
    "/cookbook\n",
  ])(
    "falls back for an invalid or unrelated destination: %s",
    (destination) => {
      expect(safeReturnTo(destination)).toBe("/app");
    },
  );

  it("drops framework prefetch metadata while preserving user filters", () => {
    expect(safeReturnTo("/cookbook/activity?page=2&_rsc=internal")).toBe(
      "/cookbook/activity?page=2",
    );
  });

  it("carries a development plan to the auth guard as well as the eventual destination", () => {
    const destination =
      "/cookbook/dashboard?chaos=GET%20/auth/me=fail:unauthenticated&chaosSeed=42";
    const href = new URL(
      authHref("/sign-in", destination),
      "https://flover.invalid",
    );
    expect(href.searchParams.get("returnTo")).toBe(destination);
    expect(href.searchParams.get("chaos")).toBe(
      "GET /auth/me=fail:unauthenticated",
    );
    expect(href.searchParams.get("chaosSeed")).toBe("42");
    expect(authHref("/sign-in", "https://other.example")).toBe("/sign-in");
  });
});
