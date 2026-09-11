import { createMemo, createSignal, For, Show, untrack } from "solid-js";
import { Alert, Skeleton } from "~/components/feedback";
import { Button } from "~/components/forms";
import { Flex } from "~/components/layout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/overlays";
import { Text } from "~/components/typography";
import type { DashboardLayout } from "~/components/workspaces";
import {
  DashboardGrid,
  decodeDashboardLayout,
  GRID,
} from "~/components/workspaces";
import type { Failure } from "~/lib/kernel";
import type { DocumentSnapshot } from "~/lib/runtime/document-store";
import { useStoredDocument } from "~/lib/runtime/hooks";
import { createBrowserStorage, createDocument } from "~/lib/storage";
import type { StoredDocument } from "~/lib/storage/port";
import { DEFAULT_LAYOUT, WIDGETS } from "./widgets";
const schema = {
  key: "layout",
  version: 1,
  decode: decodeDashboardLayout,
};
export function ReadyEditor(props: {
  document: StoredDocument<DashboardLayout>;
  snapshot: Exclude<
    DocumentSnapshot<DashboardLayout>,
    {
      state: "loading";
    }
  >;
}) {
  const document = () => props.document;
  const snapshot = () => props.snapshot;
  const [draft, setDraft] = createSignal<{
    layout: DashboardLayout;
    base: string;
  } | null>(null);
  const [editing, setEditing] = createSignal(false);
  const [writeFailure, setWriteFailure] = createSignal<Failure | null>(null);
  const [notice, setNotice] = createSignal("");
  const result = createMemo(() => snapshot().result);
  const saved = createMemo(() => {
    const _resultValue = result();
    return _resultValue.ok && _resultValue.value.state === "found"
      ? _resultValue.value.value
      : DEFAULT_LAYOUT;
  });
  const stamp = createMemo(() => {
    const _resultValue2 = result();
    return _resultValue2.ok
      ? JSON.stringify(_resultValue2.value)
      : "unreadable";
  });
  const layout = createMemo(() => draft()?.layout ?? saved());
  const externalChange = createMemo(() => {
    const _draftSnapshot = draft();
    return _draftSnapshot !== null && _draftSnapshot.base !== stamp();
  });
  function change(layout: DashboardLayout) {
    setDraft((previous) => ({
      layout,
      base: previous?.base ?? stamp(),
    }));
    setWriteFailure(null);
    setNotice("");
  }
  function save() {
    const saved = document().write(layout());
    if (!saved.ok) {
      setWriteFailure(saved.error);
      return;
    }
    setDraft(null);
    setWriteFailure(null);
    setNotice("Layout saved in this browser.");
  }
  function reset() {
    const removed = document().remove();
    if (!removed.ok) {
      setWriteFailure(removed.error);
      return;
    }
    setDraft(null);
    setWriteFailure(null);
    setNotice("Saved layout reset. The default arrangement is showing.");
  }
  const available = createMemo(() =>
    WIDGETS.filter((widget) => !layout().some((item) => item.id === widget.id)),
  );
  const bottom = createMemo(() =>
    layout().reduce((max, item) => Math.max(max, item.y + item.height), 0),
  );
  const widgets = createMemo(() =>
    layout().map((item) => {
      const widget = WIDGETS.find((widget) => widget.id === item.id);
      return {
        id: item.id,
        title: widget?.title ?? "Unavailable widget",
        content: () =>
          widget ? (
            widget.content()
          ) : (
            <Text>
              This saved widget is no longer installed. You can remove it while
              customizing.
            </Text>
          ),
      };
    }),
  );
  return (
    <Flex direction="column" gap={7}>
      <Flex justify="space-between" align="center" gap={5} wrap>
        <Text size="sm" tone="muted">
          {(() => {
            const _resultValue3 = result();
            return draft()
              ? "Unsaved changes"
              : _resultValue3.ok && _resultValue3.value.state === "found"
                ? "Saved in this browser"
                : "Default arrangement";
          })()}{" "}
          · sample data
        </Text>
        <Flex gap={4} wrap>
          {editing() && (
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild={(forwarded) => (
                  <Button
                    {...forwarded()}
                    disabled={
                      !available().length || bottom() + 5 > GRID.maxRows
                    }
                  >
                    Add widget
                  </Button>
                )}
              />
              <DropdownMenuContent>
                <For each={available()}>
                  {(widget) => (
                    <DropdownMenuItem
                      onSelect={() =>
                        change([
                          ...layout(),
                          {
                            id: widget.id,
                            x: 0,
                            y: bottom(),
                            width: 6,
                            height: 5,
                          },
                        ])
                      }
                    >
                      {widget.title}
                    </DropdownMenuItem>
                  )}
                </For>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {draft() && (
            <Button
              onClick={() => {
                setDraft(null);
                setWriteFailure(null);
              }}
            >
              Discard edits
            </Button>
          )}
          <Button onClick={() => setEditing((value) => !value)}>
            {editing() ? "Done editing" : "Customize"}
          </Button>
          <Button
            intent="primary"
            disabled={!draft() || !result().ok || externalChange()}
            onClick={save}
          >
            Save layout
          </Button>
        </Flex>
      </Flex>
      {(() => {
        const _resultValue4 = result();
        return !_resultValue4.ok ? (
          <Alert
            tone="warn"
            title="Saved layout could not be loaded"
            action={
              <Button size="sm" onClick={reset}>
                Reset saved layout
              </Button>
            }
          >
            {_resultValue4.error.message} The default arrangement is available
            to preview; the saved document has not been replaced.
          </Alert>
        ) : null;
      })()}
      {snapshot().watchFailure && result().ok && (
        <Alert tone="warn" title="Changes in other tabs cannot be observed">
          {snapshot().watchFailure?.message}
        </Alert>
      )}
      {(() => {
        const _writeFailureValue = writeFailure();
        return _writeFailureValue ? (
          <Alert tone="warn" title="Your changes were not saved" live="polite">
            {_writeFailureValue.message} Your current arrangement is still here.
          </Alert>
        ) : null;
      })()}
      {externalChange() && (
        <Alert
          tone="warn"
          title="The saved layout changed elsewhere"
          action={
            <Button size="sm" onClick={() => setDraft(null)}>
              Load saved layout
            </Button>
          }
        >
          Your unsaved edits are still here. Load the newer saved layout before
          continuing so it is not overwritten by accident.
        </Alert>
      )}
      {editing() && (
        <Text size="sm" tone="muted">
          Drag a widget by its heading, resize from its lower corner, or open
          its arrange menu for keyboard controls. Occupied spaces stay reserved.
        </Text>
      )}
      <DashboardGrid
        label="Customizable dashboard"
        widgets={widgets()}
        layout={layout()}
        editable={editing()}
        onLayoutChange={change}
        onRemove={(id) => change(layout().filter((item) => item.id !== id))}
      />
      <Flex justify="space-between" align="center" gap={5} wrap>
        <Text size="sm" tone="muted">
          <span role="status">
            {notice() ||
              "Your arrangement is saved per account on this browser. Narrow screens stack widgets without changing it."}
          </span>
        </Text>
        {result().ok && (
          <Button size="sm" intent="ghost" onClick={reset}>
            Reset saved layout
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
export function DashboardEditor(props: { accountId: string }) {
  // Guard creates a new owner when the authenticated account changes.
  const accountId = untrack(() => props.accountId);
  const document = createDocument(
    createBrowserStorage(),
    `flover.cookbook.dashboard.${accountId}`,
    schema,
  );
  const snapshot = useStoredDocument(document);
  const ready = createMemo(() => {
    const current = snapshot();
    return current.state === "loading" ? undefined : current;
  });
  return (
    <Show
      when={ready()}
      fallback={
        <div aria-busy="true" aria-label="Loading saved dashboard">
          <Skeleton height="440px" />
        </div>
      }
    >
      {(current) => <ReadyEditor document={document} snapshot={current()} />}
    </Show>
  );
}
