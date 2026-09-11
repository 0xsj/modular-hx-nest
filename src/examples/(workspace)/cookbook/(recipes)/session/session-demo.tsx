import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  untrack,
} from "solid-js";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/display";
import { Alert } from "~/components/feedback";
import { Button, Checkbox, Field, Input } from "~/components/forms";
import { Flex } from "~/components/layout";
import { Text } from "~/components/typography";
import { err, ok } from "~/lib/kernel";
import { createSessionExample } from "~/lib/root/session-recovery";
import { createLatestRead } from "~/lib/runtime/latest-read";
import { observeSource, observeStore } from "~/lib/runtime/observe";
import { createSessionRecovery } from "~/lib/runtime/session-recovery";
import { sameItemDraft } from "~/lib/services/example/item-workflow";
import { createItemDraft } from "../_components/item-draft";
import s from "../_components/recipe.module.css";
import { ScenarioChoice } from "../_components/scenario-choice";
export function SessionDemo(props: { accountId: string }) {
  // Guard creates a new owner when the authenticated account changes.
  const accountId = untrack(() => props.accountId);
  const root = createSessionExample(accountId);
  const session = createSessionRecovery(
    accountId,
    "/cookbook/session?view=editor#draft",
    root.verify,
  );
  const reader = createLatestRead(async (_: undefined, signal) => {
    const initialized = root.initialize();
    if (!initialized.ok) return err(initialized.error);
    const item = await root.detail("api", signal);
    if (!item.ok) return err(item.error);
    const saved = root.loadDraft("api");
    if (!saved.ok) return err(saved.error);
    const model = createItemDraft(
      {
        ...root,
        save: async (attempt, signal) => {
          const result = await root.save(attempt, signal);
          if (!result.ok) session.observe(result.error);
          return result;
        },
      },
      item.value,
      saved.value,
    );
    return ok(model);
  });
  const data = observeStore(reader.subscribe, reader.get, reader.server);
  createEffect(
    on(
      () => [reader, root, session],
      () => {
        const cleanup = (() => {
          void reader.run(undefined);
          return () => {
            reader.cancel();
            session.dispose();
            root.dispose();
          };
        })();
        if (typeof cleanup === "function") onCleanup(cleanup);
      },
    ),
  );
  return (
    <>
      <Alert tone="info" title="A separate demo session">
        These controls simulate authentication for this example only. Your real
        cookbook sign-in stays active. Drafts and receipts are scoped to your
        account and retained in this tab across reload.
      </Alert>
      {(() => {
        const _dataSnapshot = data();
        return _dataSnapshot.state === "ready" ? (
          <Editor model={_dataSnapshot.value} root={root} session={session} />
        ) : _dataSnapshot.state === "failed" ? (
          <Alert
            tone="warn"
            title="The saved workspace could not be opened"
            action={
              <Button onClick={() => void reader.run(undefined)}>
                Retry workspace
              </Button>
            }
          >
            {_dataSnapshot.failure.message} Existing stored data has been
            preserved.
          </Alert>
        ) : (
          <Text role="status">Opening the saved workspace…</Text>
        );
      })()}
      <Text size="sm" tone="muted">
        Frontend: checkpoint input, gate actions, verify the returning account,
        and keep an uncertain operation unresolved. Backend: authenticate every
        request, authorize account-scoped receipts, and provide a final save
        outcome. Browser storage is convenience persistence, not secure
        isolation from other users of this browser.
      </Text>
    </>
  );
}
function Editor(props: {
  model: ReturnType<typeof createItemDraft>;
  root: ReturnType<typeof createSessionExample>;
  session: ReturnType<typeof createSessionRecovery>;
}) {
  const draft = observeSource(() => props.model);
  const auth = observeSource(() => props.session);
  async function recoverSession() {
    props.root.signInAs(account());
    if (await props.session.recover()) {
      window.history.replaceState(null, "", props.session.returnTo);
      requestAnimationFrame(() =>
        document.getElementById("draft")?.scrollIntoView({
          block: "nearest",
        }),
      );
    }
  }
  const [account, setAccount] = createSignal<"owner" | "other">("owner");
  const [expiry, setExpiry] = createSignal(false),
    [offline, setOffline] = createSignal(false);
  createEffect(
    on(
      () => [props.model],
      () => {
        const cleanup = (() => {
          const protect = (event: BeforeUnloadEvent) => {
            const saved = props.model.checkpoint();
            if (!saved.ok) {
              event.preventDefault();
              event.returnValue = "";
            }
          };
          window.addEventListener("beforeunload", protect);
          return () => {
            window.removeEventListener("beforeunload", protect);
            props.model.cancel();
          };
        })();
        if (typeof cleanup === "function") onCleanup(cleanup);
      },
    ),
  );
  const unresolved = createMemo(() => "attempt" in draft().phase);
  const dirty = createMemo(
    () => !sameItemDraft(draft().draft, draft().baseline),
  );
  const active = createMemo(() => auth().state === "active");
  return (
    <div class={s.columns}>
      {active() ? (
        <Card id="draft" aria-labelledby="session-editor-title">
          <CardHeader>
            <CardTitle level={2} id="session-editor-title">
              Your recovered workspace
            </CardTitle>
            <CardDescription>
              Returning to the same account restores the editor. Saving still
              requires an explicit action.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <Flex direction="column" gap={5}>
              <Field
                label="Draft name"
                error={(() => {
                  const _draftSnapshot = draft();
                  return _draftSnapshot.phase.state === "refused" &&
                    _draftSnapshot.phase.failure.kind === "invalid" &&
                    _draftSnapshot.phase.submitted.draft.name ===
                      _draftSnapshot.draft.name
                    ? _draftSnapshot.phase.failure.fields.name
                    : undefined;
                })()}
              >
                {(control) => (
                  <Input
                    {...control}
                    maxLength={120}
                    value={draft().draft.name}
                    onInput={(event) =>
                      props.model.edit({
                        ...draft().draft,
                        name: event.target.value,
                      })
                    }
                  />
                )}
              </Field>
              <Text size="sm">Host: {draft().draft.host}</Text>
              <Flex wrap gap={3}>
                <Button
                  intent="primary"
                  disabled={!dirty() || unresolved()}
                  onClick={() => {
                    if (props.session.canContinue()) void props.model.save();
                  }}
                >
                  Save draft
                </Button>
                <Button
                  disabled={draft().phase.state !== "unknown"}
                  onClick={() => {
                    if (props.session.canContinue()) void props.model.check();
                  }}
                >
                  Check original save
                </Button>
              </Flex>
              <Text role="status">
                {unresolved()
                  ? "Save outcome unknown until the original receipt is confirmed."
                  : draft().confirmed
                    ? dirty()
                      ? "Earlier save confirmed. Newer edits remain unsaved."
                      : "Save confirmed. Your draft matches the receipt."
                    : dirty()
                      ? "Unsaved draft retained in this tab."
                      : "Ready to edit."}
              </Text>
              {(() => {
                const _draftSnapshot2 = draft();
                return _draftSnapshot2.phase.state === "unknown" ||
                  _draftSnapshot2.phase.state === "refused" ? (
                  <Alert tone="warn" title="Save needs attention">
                    {_draftSnapshot2.phase.failure.message}
                  </Alert>
                ) : null;
              })()}
            </Flex>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle level={2}>Sign in to resume</CardTitle>
            <CardDescription>
              The editor is hidden until the original account is verified. The
              draft and original operation remain in its workspace.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <Flex direction="column" gap={5}>
              <ScenarioChoice
                label="Demo sign-in account"
                value={account()}
                options={[
                  {
                    value: "owner",
                    label: "Original account",
                  },
                  {
                    value: "other",
                    label: "Different account",
                  },
                ]}
                onChange={setAccount}
              />
              {auth().state === "wrong-account" && (
                <Alert tone="warn" title="This is a different account">
                  Return with the original account to resume its draft. Nothing
                  was sent or copied to this account.
                </Alert>
              )}
              {(() => {
                const _authSnapshot = auth();
                return _authSnapshot.state === "expired" &&
                  _authSnapshot.failure ? (
                  <Alert tone="warn" title="Verification failed">
                    {_authSnapshot.failure.message}
                  </Alert>
                ) : null;
              })()}
              <Button
                intent="primary"
                loading={auth().state === "checking"}
                onClick={() => void recoverSession()}
              >
                Simulate sign-in and return
              </Button>
              <Text size="sm">Return address: {props.session.returnTo}</Text>
            </Flex>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle level={2}>Session scenarios</CardTitle>
          <CardDescription>
            Try expiry before saving, then expiry after the server has
            committed.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <Flex direction="column" gap={5}>
            <Button
              disabled={!active()}
              onClick={() => {
                props.model.checkpoint();
                props.model.cancel();
                props.root.expire();
                props.session.expire();
              }}
            >
              Expire demo session now
            </Button>
            <Field label="Expire after a save commits">
              {(control) => (
                <Checkbox
                  {...control}
                  checked={expiry()}
                  onCheckedChange={(value) => {
                    setExpiry(value === true);
                    props.root.setExpireAfterCommit(value === true);
                  }}
                />
              )}
            </Field>
            <Field label="Make sign-in verification unavailable">
              {(control) => (
                <Checkbox
                  {...control}
                  checked={offline()}
                  onCheckedChange={(value) => {
                    setOffline(value === true);
                    props.root.setVerifyUnavailable(value === true);
                  }}
                />
              )}
            </Field>
            <Text size="sm" role="status">
              Session: {auth().state}. Draft checkpoint:{" "}
              {draft().checkpointFailure ? "failed" : "available"}.
            </Text>
            {(() => {
              const _draftSnapshot3 = draft();
              return _draftSnapshot3.checkpointFailure ? (
                <Alert
                  tone="warn"
                  title="Keep this page open"
                  action={
                    <Button onClick={() => props.model.checkpoint()}>
                      Retry checkpoint
                    </Button>
                  }
                >
                  {_draftSnapshot3.checkpointFailure.message} Copy your input
                  before leaving; recovery has not been protected.
                </Alert>
              ) : null;
            })()}
          </Flex>
        </CardBody>
      </Card>
    </div>
  );
}
