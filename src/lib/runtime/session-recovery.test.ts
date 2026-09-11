import { describe, expect, it, vi } from "vitest";
import {
  err,
  forbidden,
  ok,
  unauthenticated,
  unavailable,
  type Result,
} from "../kernel";
import { createMemoryStorage } from "../storage";
import { createSessionExample } from "../root/session-recovery";
import { createItemWorkflow } from "../root/item-workflow";
import { createItemDraft } from "../../examples/(workspace)/cookbook/(recipes)/_components/item-draft";
import {
  createSessionRecovery,
  localReturnTo,
  type SessionIdentity,
} from "./session-recovery";

describe("session recovery contract (implementation-visible)", () => {
  it("expires only for unauthenticated failures and never performs verification implicitly", () => {
    const verify = vi.fn();
    const session = createSessionRecovery("a", "/app", verify);
    session.observe(forbidden("Denied"));
    expect(session.canContinue()).toBe(true);
    session.observe(unavailable("Offline"));
    expect(session.canContinue()).toBe(true);
    session.observe(unauthenticated("Expired"));
    expect(session.canContinue()).toBe(false);
    expect(verify).not.toHaveBeenCalled();
  });
  it("requires the original account, keeps verification failure visible and permits retry", async () => {
    const verify = vi
      .fn()
      .mockResolvedValueOnce(ok({ accountId: "b" }))
      .mockResolvedValueOnce(err(unavailable("Offline")))
      .mockResolvedValueOnce(ok({ accountId: "a" }));
    const session = createSessionRecovery(
      "a",
      "/cookbook/session?view=editor#draft",
      verify,
    );
    session.expire();
    expect(await session.recover()).toBe(false);
    expect(session.get().state).toBe("wrong-account");
    expect(await session.recover()).toBe(false);
    expect(session.get()).toMatchObject({
      state: "expired",
      failure: { kind: "unavailable" },
    });
    expect(await session.recover()).toBe(true);
    expect(session.returnTo).toBe("/cookbook/session?view=editor#draft");
  });
  it.each(["expire", "dispose"] as const)(
    "ignores a late verification after %s even if abort is ignored",
    async (action) => {
      let finish!: (value: Result<SessionIdentity>) => void;
      const session = createSessionRecovery(
        "a",
        "/app",
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
      session.expire();
      const pending = session.recover();
      session[action]();
      finish(ok({ accountId: "a" }));
      expect(await pending).toBe(false);
      expect(session.canContinue()).toBe(false);
    },
  );
  it.each([
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/%2fevil.test",
    "/%5cevil.test",
    "/%0aevil",
    "/broken%",
    "javascript:alert(1)",
  ])("rejects an unsafe return address %s", (address) => {
    expect(localReturnTo(address)).toBe("/app");
  });
  it("restores a checkpoint after post-commit expiry, isolates accounts, and does not resend during recovery", async () => {
    const storage = createMemoryStorage(),
      signal = new AbortController().signal;
    const root = createSessionExample("a", storage, 0);
    expect(root.initialize().ok).toBe(true);
    const item = (await root.detail("api", signal)).unwrapOr(null)!;
    const session = createSessionRecovery(
      "a",
      "/cookbook/session#draft",
      root.verify,
    );
    const save = vi.fn(async (...args: Parameters<typeof root.save>) => {
      const result = await root.save(...args);
      if (!result.ok) session.observe(result.error);
      return result;
    });
    const model = createItemDraft({ ...root, save }, item, null);
    model.edit({ name: "Before expiry", host: item.host });
    root.setExpireAfterCommit(true);
    await model.save();
    expect(model.get().phase.state).toBe("unknown");
    expect(session.canContinue()).toBe(false);
    model.edit({ name: "Newer input", host: item.host });
    root.signInAs("other");
    expect(await session.recover()).toBe(false);
    expect((await root.find("any", signal)).ok).toBe(false);
    expect(save).toHaveBeenCalledTimes(1);
    const other = createSessionExample("b", storage, 0);
    other.initialize();
    expect(other.loadDraft("api").unwrapOr("wrong")).toBeNull();
    const similarId = createItemWorkflow("session.a", storage, 0);
    similarId.initialize();
    expect(similarId.loadDraft("api").unwrapOr("wrong")).toBeNull();
    const restarted = createSessionExample("a", storage, 0);
    restarted.initialize();
    const saved = restarted.loadDraft("api").unwrapOr(null)!;
    const restored = createItemDraft(restarted, item, saved);
    expect(restored.get().phase.state).toBe("unknown");
    expect(restored.get().draft.name).toBe("Newer input");
    const again = createSessionRecovery(
      "a",
      "/cookbook/session#draft",
      restarted.verify,
    );
    again.expire();
    expect(await again.recover()).toBe(true);
    expect(restored.get().phase.state).toBe("unknown");
    await restored.save();
    expect(restored.get().phase.state).toBe("unknown");
    await restored.check();
    expect(restored.get().confirmed?.item.name).toBe("Before expiry");
    expect(restored.get().draft.name).toBe("Newer input");
    expect(save).toHaveBeenCalledTimes(1);
  });
});
