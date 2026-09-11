import { describe, expect, it } from "vitest";
import { err, ok, unavailable, type Result } from "../kernel";
import { createAccessExample } from "../root/access";
import {
  capability,
  decodeCapabilities,
  type Capabilities,
} from "../services/access";
import { createCapabilities } from "./capabilities";
const grant = (revision = 1): Capabilities => ({
  subject: "a",
  resource: "workspace",
  revision,
  grants: { view: { allowed: true }, edit: { allowed: true } },
});

describe("capabilities contract (implementation-visible)", () => {
  it("rejects malformed decisions and safely denies absent and inherited capabilities", () => {
    expect(
      decodeCapabilities({ ...grant(), grants: { view: { allowed: "true" } } })
        .ok,
    ).toBe(false);
    expect(
      decodeCapabilities({
        ...grant(),
        grants: { view: { allowed: false, reason: "" } },
      }).ok,
    ).toBe(false);
    expect(capability(grant(), "delete").allowed).toBe(false);
    expect(capability(grant(), "toString").allowed).toBe(false);
    expect(
      decodeCapabilities({ ...grant(), token: "secret" }).unwrapOr(null),
    ).toEqual(grant());
  });
  it("withdraws old grants while pending and after a failed refresh", async () => {
    let finish!: (value: Result<Capabilities>) => void;
    let immediate = true;
    const model = createCapabilities("a", "workspace", () =>
      immediate
        ? Promise.resolve(ok(grant()))
        : new Promise((resolve) => {
            finish = resolve;
          }),
    );
    expect(model.decide("edit").allowed).toBe(false);
    await model.refresh();
    expect(model.decide("edit").allowed).toBe(true);
    immediate = false;
    const pending = model.refresh();
    expect(model.decide("edit").allowed).toBe(false);
    finish(err(unavailable("Offline")));
    await pending;
    expect(model.decide("edit").allowed).toBe(false);
  });
  it("does not restore a grant from a read that predates invalidation", async () => {
    let finish!: (value: Result<Capabilities>) => void;
    const model = createCapabilities(
      "a",
      "workspace",
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const pending = model.refresh();
    model.invalidate();
    finish(ok(grant()));
    await pending;
    expect(model.get().state).toBe("unknown");
    expect(model.decide("view").allowed).toBe(false);
  });
  it("rejects scope mismatches and stale revisions", async () => {
    let next = grant(5);
    const model = createCapabilities("a", "workspace", async () => ok(next));
    await model.refresh();
    for (next of [
      grant(4),
      { ...grant(6), subject: "b" },
      { ...grant(6), resource: "other" },
    ]) {
      await model.refresh();
      expect(model.get().state).toBe("failed");
      expect(model.decide("edit").allowed).toBe(false);
    }
  });
  it("checks the authority on the operation even when the client still has a grant", async () => {
    const root = createAccessExample("a", 0),
      signal = new AbortController().signal;
    const model = createCapabilities("a", "workspace", root.permissions);
    await model.refresh();
    root.setAccess(false, false);
    expect(model.decide("edit").allowed).toBe(true);
    expect(await root.update(signal)).toMatchObject({
      ok: false,
      error: { kind: "forbidden" },
    });
    expect(await root.read(signal)).toMatchObject({
      ok: false,
      error: { kind: "forbidden" },
    });
    model.invalidate();
    await model.refresh();
    expect(model.decide("edit")).toMatchObject({
      allowed: false,
      reason: expect.any(String),
    });
    root.setAccess(true, false);
    await model.refresh();
    expect(model.decide("view").allowed).toBe(true);
    expect(model.decide("edit").allowed).toBe(false);
  });
});
