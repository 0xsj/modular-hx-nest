import { createSaveDraft } from "~/lib/runtime/save-draft";
import type { ItemWorkflow } from "~/lib/root/item-workflow";
import {
  sameItemDraft,
  type EditableItem,
  type ItemAttempt,
  type ItemReceipt,
} from "~/lib/services/example/item-workflow";
import type { NewItem } from "~/lib/services/example";

export function createItemDraft(
  root: ItemWorkflow,
  item: EditableItem,
  restored: Parameters<typeof root.checkpoint>[0] | null,
) {
  const base = restored?.item ?? item;
  return createSaveDraft<NewItem, ItemAttempt, ItemReceipt>(
    root,
    { name: base.name, host: base.host },
    {
      same: sameItemDraft,
      restored: restored ?? undefined,
      attempt: (draft, operationId, confirmed) => ({
        draft,
        operationId,
        id: base.id,
        expectedRevision: confirmed?.item.revision ?? base.revision,
      }),
      matches: (attempt, receipt) =>
        receipt.id === attempt.id &&
        receipt.expectedRevision === attempt.expectedRevision,
      refused: (failure) =>
        failure.kind === "invalid" ||
        failure.kind === "conflict" ||
        failure.kind === "not_found",
      persist: (state) =>
        root.checkpoint({
          item: base,
          draft: state.draft,
          baseline: state.baseline,
          confirmed: state.confirmed,
          attempt: "attempt" in state.phase ? state.phase.attempt : null,
        }),
    },
  );
}
