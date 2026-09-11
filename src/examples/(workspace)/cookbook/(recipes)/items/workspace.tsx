import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  Show,
  untrack,
} from "solid-js";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  Empty,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "~/components/display";
import { Alert } from "~/components/feedback";
import {
  Button,
  Field,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/forms";
import { Flex } from "~/components/layout";
import { Pagination } from "~/components/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
} from "~/components/overlays";
import { CollectionToolbar } from "~/components/patterns";
import { Text } from "~/components/typography";
import type { Failure, Result } from "~/lib/kernel";
import type { ItemWorkflow } from "~/lib/root/item-workflow";
import { createItemWorkflow } from "~/lib/root/item-workflow";
import { createLatestRead } from "~/lib/runtime/latest-read";
import { observeStore } from "~/lib/runtime/observe";
import { useUrlState } from "~/lib/runtime/url-state";
import { DiagnosticTimeline } from "../_components/diagnostic-timeline";
import type { ItemView } from "./collection";
import { itemQuery, PAGE_SIZE, selectItems } from "./collection";
import { ItemDetail } from "./item-editor";
import s from "./items.module.css";
import { Scenarios } from "./scenarios";
export function ItemWorkspace(props: { accountId: string }) {
  // Guard creates a new owner when the authenticated account changes.
  const accountId = untrack(() => props.accountId);
  const root = createItemWorkflow(accountId);
  const [initialized, setInitialized] = createSignal<Result<void> | null>(null);
  const [resetOpen, setResetOpen] = createSignal(false);
  createEffect(
    on(
      () => [root],
      () => {
        const cleanup = (() => {
          let active = true;
          void Promise.resolve().then(() => {
            if (active) setInitialized(root.initialize());
          });
          return () => {
            active = false;
            root.dispose();
          };
        })();
        if (typeof cleanup === "function") onCleanup(cleanup);
      },
    ),
  );
  return (
    <Flex direction="column" gap={7}>
      <Alert tone="info" title="A complete workflow over a tab-local demo">
        Records, save receipts and private drafts are stored separately in this
        tab, per account. Reloading keeps them; closing the tab ends the demo.
        Share the address to share a view of the sample items, not your private
        edits.
      </Alert>
      {(() => {
        const _initializedSnapshot = initialized();
        return _initializedSnapshot === null ? (
          <Text role="status">Opening the item workspace…</Text>
        ) : !_initializedSnapshot.ok ? (
          <Alert
            tone="warn"
            title="The item workspace could not be opened"
            action={
              <Button onClick={() => setInitialized(root.initialize())}>
                Retry opening
              </Button>
            }
          >
            {_initializedSnapshot.error.message} Existing documents have not
            been replaced.
          </Alert>
        ) : (
          <WorkspaceContents root={root} />
        );
      })()}
      <Flex justify="space-between" align="center" gap={4} wrap>
        <Text size="sm" tone="muted">
          This example requires durable operation receipts from a real backend
          before adopting its save recovery.
        </Text>
        <Button size="sm" onClick={() => setResetOpen(true)}>
          Reset item demo
        </Button>
      </Flex>
      <AlertDialog open={resetOpen()} onOpenChange={setResetOpen}>
        <AlertDialogContent
          title="Reset the item demo?"
          description="All item changes, draft checkpoints and save receipts for this demo account in this tab will be removed. Other cookbook data is unaffected."
        >
          <AlertDialogCancel
            asChild={(forwarded) => (
              <Button {...forwarded()}>Keep the demo</Button>
            )}
          />
          <AlertDialogAction
            asChild={(forwarded) => (
              <Button
                {...forwarded()}
                intent="danger"
                onClick={() => {
                  root.dispose();
                  const result = root.reset();
                  setInitialized(result.ok ? null : result);
                  if (result.ok) window.location.reload();
                }}
              >
                Reset demo data
              </Button>
            )}
          />
        </AlertDialogContent>
      </AlertDialog>
    </Flex>
  );
}
function WorkspaceContents(props: { root: ItemWorkflow }) {
  const url = useUrlState(itemQuery),
    view = createMemo(() => url.value);
  const [failure, setFailure] = createSignal<Failure | null>(null);
  const reader = createLatestRead((_input: undefined, signal) =>
    props.root.list(signal),
  );
  const state = observeStore(reader.subscribe, reader.get, reader.server);
  const refresh = () => {
    void reader.run(undefined);
  };
  createEffect(
    on(
      () => [reader, refresh],
      () => {
        const cleanup = (() => {
          refresh();
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
  const selected = createMemo(() => {
    const _dataSnapshot = data();
    return _dataSnapshot ? selectItems(_dataSnapshot, view()) : null;
  });
  const outside = createMemo(() => {
    const _selectedSnapshot = selected();
    return (
      _selectedSnapshot &&
      _selectedSnapshot.total > 0 &&
      view().page > _selectedSnapshot.pages
    );
  });
  const change = (update: (current: ItemView) => ItemView, replace = false) => {
    const result = url.update(update, replace ? "replace" : "push");
    setFailure(result.ok ? null : result.error);
  };
  return (
    <Flex direction="column" gap={7}>
      {(() => {
        const _failureSnapshot = failure();
        return _failureSnapshot ? (
          <Alert tone="warn" title="The view address could not be updated">
            {_failureSnapshot.message}
          </Alert>
        ) : null;
      })()}
      {url.issues.length > 0 && (
        <Alert
          tone="warn"
          title="Some URL values could not be used"
          action={
            <Button
              size="sm"
              onClick={() => change((current) => current, true)}
            >
              Use valid URL values
            </Button>
          }
        >
          <ul>
            <For each={url.issues}>{(issue) => <li>{issue.message}</li>}</For>
          </ul>
        </Alert>
      )}
      <Scenarios root={props.root} />
      <div class={s.workspace}>
        <Card aria-labelledby="items-title">
          <CardHeader
            actions={
              <Button
                size="sm"
                disabled={state().state === "pending"}
                onClick={refresh}
              >
                Refresh collection
              </Button>
            }
          >
            <CardTitle id="items-title" level={2}>
              Items
            </CardTitle>
            <CardDescription>
              Open an item to edit. Filtering the collection keeps the selected
              item open.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <Flex direction="column" gap={5}>
              <CollectionToolbar>
                <Show keyed when={[view().q]}>
                  {(_key) => (
                    <form
                      class={s.search}
                      onSubmit={(event) => {
                        event.preventDefault();
                        const q = String(
                          new FormData(event.currentTarget).get("q") ?? "",
                        );
                        change((current) => ({
                          ...current,
                          q,
                          page: 1,
                        }));
                      }}
                    >
                      <Field label="Search items">
                        {(control) => (
                          <Input
                            {...control}
                            name="q"
                            value={view().q}
                            maxLength={80}
                            placeholder="Name or hostname"
                          />
                        )}
                      </Field>
                      <Button type="submit">Search</Button>
                    </form>
                  )}
                </Show>
                <div class={s.choice}>
                  <Field label="Host filter">
                    {(control) => (
                      <Select
                        value={view().scope}
                        onValueChange={(scope) => {
                          if (
                            scope === "all" ||
                            scope === "internal" ||
                            scope === "public"
                          )
                            change((current) => ({
                              ...current,
                              scope,
                              page: 1,
                            }));
                        }}
                        items={[
                          {
                            value: "all",
                            label: "All hosts",
                          },
                          {
                            value: "internal",
                            label: "Internal hosts",
                          },
                          {
                            value: "public",
                            label: "Public hosts",
                          },
                        ]}
                      >
                        <SelectTrigger {...control}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All hosts</SelectItem>
                          <SelectItem value="internal">
                            Internal hosts
                          </SelectItem>
                          <SelectItem value="public">Public hosts</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                </div>
                <div class={s.choice}>
                  <Field label="Sort items">
                    {(control) => (
                      <Select
                        value={view().sort}
                        onValueChange={(sort) => {
                          if (sort === "name" || sort === "host")
                            change((current) => ({
                              ...current,
                              sort,
                              page: 1,
                            }));
                        }}
                        items={[
                          {
                            value: "name",
                            label: "Name",
                          },
                          {
                            value: "host",
                            label: "Hostname",
                          },
                        ]}
                      >
                        <SelectTrigger {...control}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="host">Hostname</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                </div>
              </CollectionToolbar>
              {(() => {
                const _stateSnapshot2 = state();
                return _stateSnapshot2.state === "failed" ? (
                  <Alert
                    tone="warn"
                    title="The collection could not be refreshed"
                  >
                    {_stateSnapshot2.failure.message}{" "}
                    {data() &&
                      "Previously accepted items remain visible and may be stale."}
                  </Alert>
                ) : null;
              })()}
              <Text size="sm" tone="muted" role="status">
                {state().state === "pending"
                  ? "Loading items…"
                  : (() => {
                      const _selectedSnapshot2 = selected();
                      return !_selectedSnapshot2
                        ? "No collection has been accepted yet."
                        : _selectedSnapshot2.total === 0
                          ? "No items match these filters."
                          : outside()
                            ? `Page ${view().page} is outside the ${_selectedSnapshot2.pages} available pages.`
                            : `Showing ${(view().page - 1) * PAGE_SIZE + 1}–${Math.min(view().page * PAGE_SIZE, _selectedSnapshot2.total)} of ${_selectedSnapshot2.total} items. Page ${view().page} of ${_selectedSnapshot2.pages}.`;
                    })()}
              </Text>
              {(() => {
                const _selectedSnapshot3 = selected();
                return _selectedSnapshot3 ? (
                  _selectedSnapshot3.total === 0 ? (
                    <Empty
                      title="No matching items"
                      body="Try another search or host filter."
                      action={
                        <Button
                          onClick={() =>
                            change((current) => ({
                              ...itemQuery.defaults,
                              item: current.item,
                            }))
                          }
                        >
                          Clear item filters
                        </Button>
                      }
                    />
                  ) : outside() ? (
                    <Empty
                      title="This page is outside the results"
                      action={
                        <Button
                          onClick={() =>
                            change((current) => ({
                              ...current,
                              page: 1,
                            }))
                          }
                        >
                          Go to first page
                        </Button>
                      }
                    />
                  ) : (
                    <Table
                      caption="Items in this view"
                      scrollLabel="Item collection"
                    >
                      <THead>
                        <Tr>
                          <Th>Item</Th>
                          <Th>Hostname</Th>
                        </Tr>
                      </THead>
                      <TBody>
                        <For each={_selectedSnapshot3.rows}>
                          {(item) => (
                            <Tr
                              data-selected={
                                view().item === item.id || undefined
                              }
                            >
                              <Td>
                                <Button
                                  size="sm"
                                  intent="ghost"
                                  aria-label={`Open ${item.name}`}
                                  aria-pressed={view().item === item.id}
                                  onClick={() =>
                                    change((current) => ({
                                      ...current,
                                      item: item.id,
                                    }))
                                  }
                                >
                                  {item.name}
                                </Button>
                              </Td>
                              <Td class={s.host}>{item.host}</Td>
                            </Tr>
                          )}
                        </For>
                      </TBody>
                    </Table>
                  )
                ) : null;
              })()}
              {(() => {
                const _selectedSnapshot4 = selected();
                return _selectedSnapshot4 && !outside() ? (
                  <Pagination
                    label="Item pages"
                    page={view().page}
                    totalPages={_selectedSnapshot4.pages}
                    onPageChange={(page) =>
                      change((current) => ({
                        ...current,
                        page,
                      }))
                    }
                  />
                ) : null;
              })()}
            </Flex>
          </CardBody>
        </Card>
        {(() => {
          const _viewSnapshot = view();
          return _viewSnapshot.item ? (
            <Show keyed when={_viewSnapshot.item}>
              {(_key) => (
                <ItemDetail
                  root={props.root}
                  id={view().item}
                  onSaved={refresh}
                  onClose={() =>
                    change((current) => ({
                      ...current,
                      item: "",
                    }))
                  }
                />
              )}
            </Show>
          ) : (
            <Card>
              <CardBody>
                <Empty
                  title="Choose an item"
                  body="Open a row to inspect and edit its details. The selected item is part of this view’s address."
                />
              </CardBody>
            </Card>
          );
        })()}
      </div>
      <DiagnosticTimeline buffer={props.root.diagnostics} />
    </Flex>
  );
}
