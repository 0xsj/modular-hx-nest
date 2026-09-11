import { createMemoryClient } from "../http";
import { err, forbidden, ok, unauthenticated, unavailable } from "../kernel";
import { currentUser } from "../services/session";
import type { ItemAttempt } from "../services/example/item-workflow";
import { createBrowserStorage, type StoragePort } from "../storage";
import { createItemWorkflow } from "./item-workflow";

export function createSessionExample(
  accountId: string,
  storage: StoragePort = createBrowserStorage("session"),
  latencyMs = 200,
) {
  const items = createItemWorkflow(accountId, storage, latencyMs, "session");
  let identity: string | null = accountId,
    expireAfterCommit = false,
    verifyUnavailable = false;
  const refused = () =>
    identity === null
      ? unauthenticated("Your demo session expired. Sign in again to continue.")
      : identity !== accountId
        ? forbidden("This workspace belongs to a different account.")
        : null;
  const client = createMemoryClient({
    latencyMs,
    routes: [
      {
        method: "GET",
        pattern: /^\/auth\/me$/,
        handle: () =>
          verifyUnavailable
            ? err(
                unavailable("Sign-in verification is temporarily unavailable."),
              )
            : identity === null
              ? err(unauthenticated("Sign in to continue."))
              : ok({
                  id: identity,
                  name: "Demo account",
                  email: "demo@example.com",
                }),
      },
    ],
  });
  return {
    ...items,
    async save(attempt: ItemAttempt, signal: AbortSignal) {
      const failure = refused();
      if (failure) return err(failure);
      const result = await items.save(attempt, signal);
      if (result.ok && expireAfterCommit) {
        identity = null;
        return err(
          unauthenticated(
            "The session expired after the server processed this request. Its outcome needs checking.",
          ),
        );
      }
      return result;
    },
    find(operationId: string, signal: AbortSignal) {
      const failure = refused();
      return failure
        ? Promise.resolve(err(failure))
        : items.find(operationId, signal);
    },
    verify: async (signal: AbortSignal) =>
      (await currentUser(client, { signal })).map((user) => ({
        accountId: user.id,
      })),
    expire() {
      identity = null;
    },
    signInAs(account: "owner" | "other") {
      identity = account === "owner" ? accountId : `${accountId}:other`;
    },
    setExpireAfterCommit(value: boolean) {
      expireAfterCommit = value;
    },
    setVerifyUnavailable(value: boolean) {
      verifyUnavailable = value;
    },
  };
}
