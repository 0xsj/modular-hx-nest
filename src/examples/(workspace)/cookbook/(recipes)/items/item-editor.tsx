import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  Show,
} from "solid-js";
import {
  Badge,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Empty,
} from "~/components/display";
import { Alert } from "~/components/feedback";
import { Button, Field, Input } from "~/components/forms";
import { Flex } from "~/components/layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
} from "~/components/overlays";
import { Text } from "~/components/typography";
import { err, ok } from "~/lib/kernel";
import type { ItemWorkflow } from "~/lib/root/item-workflow";
import { createLatestRead } from "~/lib/runtime/latest-read";
import { observeSource, observeStore } from "~/lib/runtime/observe";
import type { EditableItem } from "~/lib/services/example/item-workflow";
import { sameItemDraft } from "~/lib/services/example/item-workflow";
import { createItemDraft } from "../_components/item-draft";
import s from "./items.module.css";
type EditorModel = ReturnType<typeof createItemDraft>;

/** Key this region by id: a previous item's data is never a loading fallback. */
export function ItemDetail(props: {
  root: ItemWorkflow;
  id: string;
  onSaved(): void;
  onClose(): void;
}) {
  const reader = createLatestRead(async (reload: boolean, signal) => {
    const result = await props.root.detail(props.id, signal);
    if (!result.ok) return err(result.error);
    const saved = props.root.loadDraft(props.id);
    if (!saved.ok) return err(saved.error);
    const model = createItemDraft(
      props.root,
      result.value,
      reload ? null : saved.value,
    );
    if (reload) {
      const stored = model.checkpoint();
      if (!stored.ok) return err(stored.error);
    }
    return ok({
      item: !reload && saved.value ? saved.value.item : result.value,
      model,
    });
  });
  const state = observeStore(reader.subscribe, reader.get, reader.server);
  createEffect(
    on(
      () => [reader],
      () => {
        const cleanup = (() => {
          void reader.run(false);
          return () => reader.cancel();
        })();
        if (typeof cleanup === "function") onCleanup(cleanup);
      },
    ),
  );
  const data = createMemo(() => {
    const _stateSnapshot = state();
    return _stateSnapshot.state === "ready"
      ? _stateSnapshot.value
      : _stateSnapshot.state === "idle"
        ? undefined
        : _stateSnapshot.previous;
  });
  return (
    <section aria-label="Selected item" class={s.detail}>
      {state().state === "pending" && (
        <Text role="status">Loading the selected item…</Text>
      )}
      {(() => {
        const _stateSnapshot2 = state();
        return _stateSnapshot2.state === "failed" ? (
          <Alert
            tone="warn"
            title={
              _stateSnapshot2.failure.kind === "not_found"
                ? "Item not found"
                : "Item details could not be loaded"
            }
            action={
              <Button size="sm" onClick={() => void reader.run(false)}>
                Retry item
              </Button>
            }
          >
            {_stateSnapshot2.failure.message}{" "}
            {data() && "The previous item view is still here."}
          </Alert>
        ) : null;
      })()}
      {(() => {
        const _dataSnapshot = data();
        return (
          <>
            {_dataSnapshot ? (
              <Show
                keyed
                when={`${_dataSnapshot.item.id}:${_dataSnapshot.item.revision}`}
              >
                {(_key) => (
                  <ItemEditor
                    model={data()!.model}
                    item={data()!.item}
                    refreshing={state().state === "pending"}
                    onSaved={props.onSaved}
                    onReload={() => void reader.run(true)}
                    onClose={props.onClose}
                    root={props.root}
                  />
                )}
              </Show>
            ) : (
              state().state !== "pending" && (
                <Empty
                  title="No item details available"
                  body="Choose another item or retry this read."
                  action={
                    <Button onClick={props.onClose}>
                      Back to the collection
                    </Button>
                  }
                />
              )
            )}
          </>
        );
      })()}
    </section>
  );
}
function ItemEditor(props: {
  model: EditorModel;
  item: EditableItem;
  root: ItemWorkflow;
  refreshing: boolean;
  onSaved(): void;
  onReload(): void;
  onClose(): void;
}) {
  const holding = observeSource(() => ({
    subscribe: props.root.subscribeHeld,
    get: props.root.isHolding,
    server: () => false,
  }));

  const state = observeSource(() => props.model);
  const [confirm, setConfirm] = createSignal<"discard" | "reload" | null>(null);
  const form: {
    current: HTMLFormElement | null;
  } = {
    current: null,
  };
  const lastReceipt = {
    current: state().confirmed?.operationId,
  };
  const busy = createMemo(() => {
    const _stateSnapshot3 = state();
    return (
      _stateSnapshot3.phase.state === "saving" ||
      _stateSnapshot3.phase.state === "checking"
    );
  });
  const unresolved = createMemo(
    () => busy() || state().phase.state === "unknown",
  );
  const dirty = createMemo(
    () => !sameItemDraft(state().draft, state().baseline),
  );
  const failure = createMemo(() => {
    const _stateSnapshot4 = state();
    return _stateSnapshot4.phase.state === "refused" ||
      _stateSnapshot4.phase.state === "unknown"
      ? _stateSnapshot4.phase.failure
      : null;
  });
  const fields = createMemo(() => {
    const _failureSnapshot = failure();
    return _failureSnapshot?.kind === "invalid"
      ? _failureSnapshot.fields
      : undefined;
  });
  const submitted = createMemo(() => {
    const _stateSnapshot5 = state();
    return _stateSnapshot5.phase.state === "refused"
      ? _stateSnapshot5.phase.submitted.draft
      : null;
  });
  const revision = createMemo(
    () => state().confirmed?.item.revision ?? props.item.revision,
  );
  createEffect(
    on(
      () => [state().confirmed, props.onSaved],
      () => {
        const cleanup = (() => {
          const confirmed = state().confirmed;
          if (confirmed && lastReceipt.current !== confirmed.operationId) {
            lastReceipt.current = confirmed.operationId;
            props.onSaved?.();
          }
        })();
        if (typeof cleanup === "function") onCleanup(cleanup);
      },
    ),
  );
  createEffect(
    on(
      () => [props.model, props.root],
      () => {
        const cleanup = (() => {
          const protect = (event: BeforeUnloadEvent) => {
            if (props.root.isResetting()) return;
            const value = props.model.get();
            props.model.checkpoint();
            if (
              !sameItemDraft(value.draft, value.baseline) ||
              "attempt" in value.phase ||
              value.checkpointFailure
            ) {
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
  const notice = createMemo(() => {
    const _stateSnapshot7 = state();
    return _stateSnapshot7.phase.state === "saving"
      ? "Saving the captured draft. You can keep editing."
      : _stateSnapshot7.phase.state === "checking"
        ? "Checking the earlier save. Your current input is unchanged."
        : _stateSnapshot7.phase.state === "unknown"
          ? "Save outcome unknown. Check the receipt before sending another save."
          : _stateSnapshot7.phase.state === "refused"
            ? "Save refused. Your edits are still here."
            : _stateSnapshot7.phase.state === "not-recorded"
              ? "No save was recorded. Your draft is ready for another attempt."
              : _stateSnapshot7.confirmed
                ? dirty()
                  ? "The earlier draft is saved. Your newer edits are still unsaved."
                  : "Saved. Your current draft matches the confirmed item."
                : dirty()
                  ? _stateSnapshot7.checkpointFailure
                    ? "Unsaved changes. The draft checkpoint failed; keep this page open."
                    : "Unsaved changes. Your draft is checkpointed in this tab."
                  : "This draft matches the loaded item.";
  });
  return (
    <Card aria-labelledby="item-editor-title">
      <CardHeader
        actions={
          <Badge tone={unresolved() ? "warn" : dirty() ? "accent" : "neutral"}>
            {unresolved()
              ? "Needs resolution"
              : dirty()
                ? "Unsaved changes"
                : `Revision ${revision()}`}
          </Badge>
        }
      >
        <CardTitle id="item-editor-title" level={2}>
          Edit {state().confirmed?.item.name ?? props.item.name}
        </CardTitle>
        <CardDescription>
          Item {props.item.id}. Drafts and demo records stay in this tab, per
          account, across navigation and reload.
        </CardDescription>
      </CardHeader>
      <CardBody>
        <Flex direction="column" gap={5}>
          {(() => {
            const _failureSnapshot2 = failure();
            return _failureSnapshot2 ? (
              <Alert
                tone="warn"
                title={
                  state().phase.state === "unknown"
                    ? "Check the save outcome"
                    : "The item was not saved"
                }
              >
                {_failureSnapshot2.message}
              </Alert>
            ) : null;
          })()}
          {(() => {
            const _stateSnapshot8 = state();
            return _stateSnapshot8.checkpointFailure ? (
              <Alert
                tone="warn"
                title="Draft recovery is not protected"
                action={
                  <Button size="sm" onClick={() => props.model.checkpoint()}>
                    Retry draft checkpoint
                  </Button>
                }
              >
                {_stateSnapshot8.checkpointFailure.message} Keep this page open
                or copy your input before leaving.
              </Alert>
            ) : null;
          })()}
          <form
            ref={(element) => (form.current = element)}
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              await props.model.save();
              form.current
                ?.querySelector<HTMLInputElement>('[aria-invalid="true"]')
                ?.focus();
            }}
          >
            <Flex direction="column" gap={5}>
              <Field
                label="Item name"
                required
                error={
                  submitted()?.name === state().draft.name
                    ? fields()?.name
                    : undefined
                }
              >
                {(control) => (
                  <Input
                    {...control}
                    name="name"
                    maxLength={120}
                    value={state().draft.name}
                    onInput={(event) =>
                      props.model.edit({
                        ...state().draft,
                        name: event.target.value,
                      })
                    }
                  />
                )}
              </Field>
              <Field
                label="Hostname"
                required
                error={
                  submitted()?.host === state().draft.host
                    ? fields()?.host
                    : undefined
                }
                hint="Use letters, numbers, dots or hyphens. Hostnames must be unique."
              >
                {(control) => (
                  <Input
                    {...control}
                    name="item-host"
                    maxLength={253}
                    value={state().draft.host}
                    onInput={(event) =>
                      props.model.edit({
                        ...state().draft,
                        host: event.target.value,
                      })
                    }
                  />
                )}
              </Field>
              <Flex gap={3} wrap>
                <Button
                  type="submit"
                  intent="primary"
                  disabled={!dirty() || unresolved() || props.refreshing}
                >
                  Save changes
                </Button>
                <Button
                  type="button"
                  disabled={!dirty() || unresolved() || props.refreshing}
                  onClick={() => setConfirm("discard")}
                >
                  Discard edits
                </Button>
                <Button
                  type="button"
                  disabled={unresolved() || props.refreshing}
                  onClick={() => setConfirm("reload")}
                >
                  Reload saved version
                </Button>
                {state().phase.state === "unknown" && (
                  <Button
                    type="button"
                    intent="primary"
                    onClick={() => void props.model.check()}
                  >
                    Check save outcome
                  </Button>
                )}
                {state().phase.state === "saving" && holding() && (
                  <Button type="button" onClick={() => props.root.release()}>
                    Release held response
                  </Button>
                )}
                {busy() && (
                  <Button type="button" onClick={() => props.model.cancel()}>
                    Stop waiting
                  </Button>
                )}
              </Flex>
            </Flex>
          </form>
          <Text size="sm" role="status" aria-atomic="true">
            {notice()}
          </Text>
          {(() => {
            const _stateSnapshot9 = state();
            return _stateSnapshot9.confirmed ? (
              <Text size="sm" tone="muted">
                Confirmed: {_stateSnapshot9.confirmed.item.name} ·{" "}
                {_stateSnapshot9.confirmed.item.host} · revision{" "}
                {_stateSnapshot9.confirmed.item.revision}
              </Text>
            ) : null;
          })()}
        </Flex>
      </CardBody>
      <CardFooter>
        <Text size="sm" tone="muted">
          Selecting another item keeps this draft for your return.
        </Text>
        <Button size="sm" onClick={props.onClose}>
          Close item
        </Button>
      </CardFooter>
      <AlertDialog
        open={confirm() !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <AlertDialogContent
          title={
            confirm() === "reload"
              ? "Load the saved version?"
              : "Discard these edits?"
          }
          description={
            confirm() === "reload"
              ? "The saved item will replace this draft. Any unsaved input in this editor will be discarded."
              : "This editor will return to its last confirmed values. This cannot be undone."
          }
        >
          <AlertDialogCancel
            asChild={(forwarded) => (
              <Button {...forwarded()}>Keep editing</Button>
            )}
          />
          <AlertDialogAction
            asChild={(forwarded) => (
              <Button
                {...forwarded()}
                intent="danger"
                onClick={() => {
                  if (confirm() === "reload") props.onReload?.();
                  else props.model.discard();
                  setConfirm(null);
                }}
              >
                {confirm() === "reload"
                  ? "Load saved version"
                  : "Discard edits"}
              </Button>
            )}
          />
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
