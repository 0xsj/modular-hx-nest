import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
} from "solid-js";
import {
  Badge,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Stat,
} from "~/components/display";
import { Alert } from "~/components/feedback";
import {
  Button,
  Checkbox,
  Field,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "~/components/forms";
import { Flex } from "~/components/layout";
import { Text } from "~/components/typography";
import { createNoteExample, type SaveMode } from "~/lib/root/resilience";
import { observeStore } from "~/lib/runtime/observe";
import { createNoteModel, sameDraft } from "./note-model";
import s from "./resilience.module.css";
const SAVE_MODES: Array<{
  value: SaveMode;
  label: string;
}> = [
  {
    value: "lost-response",
    label: "Commit, then lose the response",
  },
  {
    value: "not-delivered",
    label: "Request never reaches the server",
  },
  {
    value: "refused",
    label: "Server refuses the title",
  },
  {
    value: "success",
    label: "Save successfully",
  },
];
export function NoteDemo(props: { onReset: () => void }) {
  const example = createNoteExample();
  const model = createNoteModel(example, {
    title: "Launch checklist",
    body: "Review the recovery states before shipping.",
  });
  const [mode, setMode] = createSignal<SaveMode>("lost-response");
  const [failedChecks, setFailedChecks] = createSignal(false);
  const state = observeStore(model.subscribe, model.get, model.server);
  const draft = createMemo(() => state().draft);
  const confirmed = createMemo(() => state().confirmed);
  const phase = createMemo(() => state().phase);
  createEffect(
    on(
      () => [model],
      () => {
        const cleanup = () => model.cancel();
        if (typeof cleanup === "function") onCleanup(cleanup);
      },
    ),
  );
  const busy = createMemo(() => {
    const _phaseSnapshot = phase();
    return (
      _phaseSnapshot.state === "saving" || _phaseSnapshot.state === "checking"
    );
  });
  const uncertain = createMemo(() => {
    const _phaseSnapshot2 = phase();
    return (
      _phaseSnapshot2.state === "unknown" ||
      _phaseSnapshot2.state === "checking"
    );
  });
  const saved = createMemo(() => {
    const _confirmedSnapshot = confirmed();
    return (
      phase().state === "ready" &&
      _confirmedSnapshot !== null &&
      sameDraft(draft(), _confirmedSnapshot.draft)
    );
  });
  const fieldError = createMemo(() => {
    const _phaseSnapshot3 = phase();
    return _phaseSnapshot3.state === "refused" &&
      _phaseSnapshot3.failure.kind === "invalid"
      ? _phaseSnapshot3.failure.fields.title
      : undefined;
  });
  const status = createMemo(() => {
    const _phaseSnapshot4 = phase();
    return _phaseSnapshot4.state === "saving"
      ? "Saving the captured draft… You can keep editing."
      : _phaseSnapshot4.state === "checking"
        ? "Checking the existing operation. No new write is being sent."
        : _phaseSnapshot4.state === "unknown"
          ? "Save outcome unknown. Your draft is safe here; check the outcome before saving again."
          : _phaseSnapshot4.state === "refused"
            ? "Save refused. Your input has been preserved."
            : _phaseSnapshot4.state === "not-recorded"
              ? "No save was recorded. Your draft is ready for another attempt."
              : saved()
                ? "Saved. The current draft matches the confirmed receipt."
                : confirmed()
                  ? "The earlier draft is saved. Your newer edits are still unsaved."
                  : "This draft has not been saved.";
  });
  return (
    <Card aria-labelledby="note-title">
      <CardHeader
        actions={
          <Badge tone={uncertain() ? "warn" : saved() ? "accent" : "neutral"}>
            {uncertain() ? "Outcome unknown" : saved() ? "Saved" : "Draft"}
          </Badge>
        }
      >
        <CardTitle id="note-title" level={2}>
          Keep the draft. Check the save.
        </CardTitle>
        <CardDescription>
          A missing response does not tell you whether a write happened. Confirm
          its outcome before sending another.
        </CardDescription>
      </CardHeader>
      <CardBody>
        <div class={s.note}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void model.save();
            }}
          >
            <Flex direction="column" gap={5}>
              <Field label="Note title" required error={fieldError()}>
                {(control) => (
                  <Input
                    {...control}
                    value={draft().title}
                    onInput={(event) =>
                      model.edit({
                        ...draft(),
                        title: event.target.value,
                      })
                    }
                  />
                )}
              </Field>
              <Field
                label="Note body"
                hint="Drafts stay on this page only. Reloading or resetting the example clears them."
              >
                {(control) => (
                  <Textarea
                    {...control}
                    rows={5}
                    value={draft().body}
                    onInput={(event) =>
                      model.edit({
                        ...draft(),
                        body: event.target.value,
                      })
                    }
                  />
                )}
              </Field>
              <Flex gap={3} wrap>
                <Button
                  type="submit"
                  intent="primary"
                  loading={phase().state === "saving"}
                  disabled={busy() || uncertain() || saved()}
                >
                  Save note
                </Button>
                <Button
                  loading={phase().state === "checking"}
                  disabled={phase().state !== "unknown"}
                  onClick={() => void model.check()}
                >
                  Check save outcome
                </Button>
              </Flex>
              <Text size="sm" role="status" aria-atomic="true">
                {status()}
              </Text>
              {(() => {
                const _phaseSnapshot5 = phase();
                return _phaseSnapshot5.state === "unknown" ? (
                  <Alert tone="warn" title="The outcome needs confirmation">
                    {_phaseSnapshot5.failure.message} Checking reads the
                    original save receipt and does not repeat the write.
                  </Alert>
                ) : null;
              })()}
              {(() => {
                const _phaseSnapshot6 = phase();
                return _phaseSnapshot6.state === "refused" ? (
                  <Alert tone="warn" title="The note was not saved">
                    {_phaseSnapshot6.failure.message}
                  </Alert>
                ) : null;
              })()}
            </Flex>
          </form>
          <Flex direction="column" gap={6} class={s.controls}>
            <Field label="Next save behavior">
              {(control) => (
                <Select
                  value={mode()}
                  onValueChange={(value) => {
                    const selected = SAVE_MODES.find(
                      (option) => option.value === value,
                    );
                    if (selected) {
                      setMode(selected.value);
                      example.setSaveMode(selected.value);
                    }
                  }}
                  items={[
                    ...SAVE_MODES.map((option) => ({
                      value: option.value,
                      label: option.label,
                    })),
                  ]}
                >
                  <SelectTrigger {...control}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <For each={SAVE_MODES}>
                      {(option) => (
                        <SelectItem value={option.value}>
                          {option.label}
                        </SelectItem>
                      )}
                    </For>
                  </SelectContent>
                </Select>
              )}
            </Field>
            <Field
              label="Make receipt checks fail"
              hint="The original operation stays unresolved until a check succeeds."
            >
              {(control) => (
                <Checkbox
                  {...control}
                  checked={failedChecks()}
                  onCheckedChange={(value) => {
                    setFailedChecks(value === true);
                    example.failChecks(value === true);
                  }}
                />
              )}
            </Field>
            <div class={s.stats}>
              <Stat
                label="Simulated commits"
                value={(state(), example.committed())}
                hint="server-side changes in this example"
              />
              <Stat
                label="Confirmed revision"
                value={confirmed()?.revision}
                hint="last receipt accepted by the client"
              />
            </div>
            {(() => {
              const _confirmedSnapshot2 = confirmed();
              return _confirmedSnapshot2 ? (
                <div class={s.receipt}>
                  <Text size="sm" weight="medium">
                    Last confirmed note
                  </Text>
                  <Text>{_confirmedSnapshot2.draft.title}</Text>
                  <Text size="sm" tone="muted" class={s.noteBody}>
                    {_confirmedSnapshot2.draft.body || "Empty body"}
                  </Text>
                </div>
              ) : null;
            })()}
          </Flex>
        </div>
      </CardBody>
      <CardFooter>
        <Flex direction="column" gap={4}>
          <Text size="sm" tone="muted">
            This example server deduplicates operation IDs and gives a final
            answer about each save. A real backend must provide that contract
            too: “not found yet” is not enough to safely start another write.
          </Text>
          <div>
            <Button size="sm" onClick={props.onReset}>
              Reset note example
            </Button>
          </div>
        </Flex>
      </CardFooter>
    </Card>
  );
}
