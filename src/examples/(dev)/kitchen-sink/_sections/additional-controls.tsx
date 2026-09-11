import { createSignal } from "solid-js";
import { Progress } from "~/components/feedback";
import { Slider } from "~/components/forms";
import { Pagination } from "~/components/navigation";
import { Text } from "~/components/typography";
import { Case, Row } from "../_components/section";
import s from "../_components/sink.module.css";
export function SliderCase() {
  const [volume, setVolume] = createSignal(40);
  const [committed, setCommitted] = createSignal(40);
  return (
    <Case
      title="Slider"
      note="a single numeric value; arrow keys, Home, and End"
    >
      <div class={s.controlExample}>
        <Text as="div">
          Volume <output>{volume()}%</output>
        </Text>
        <Slider
          label="Volume"
          value={volume()}
          onValueChange={setVolume}
          onValueCommit={setCommitted}
        />
        <Text size="sm" tone="quiet">
          Last committed: {committed()}%
        </Text>
        <Text>Uncontrolled, in increments of five</Text>
        <Slider label="Interval" defaultValue={25} min={5} max={60} step={5} />
        <Text tone="muted">Disabled</Text>
        <Slider label="Disabled volume" value={60} disabled />
      </div>
    </Case>
  );
}
export function ProgressCase() {
  const [value, setValue] = createSignal(64);
  return (
    <Case title="Progress" note="measured, complete, zero, and indeterminate">
      <div class={s.controlExample}>
        <Text as="div">
          Import progress <output>{value()}%</output>
        </Text>
        <Progress label="Import progress" value={value()} />
        <Slider
          label="Preview import progress"
          value={value()}
          onValueChange={setValue}
        />
        <Text tone="muted">Not started · 0%</Text>
        <Progress label="Not started" value={0} />
        <Text tone="muted">Complete · 100%</Text>
        <Progress label="Complete" value={100} />
        <Text tone="muted">Preparing import · amount unknown</Text>
        <Progress label="Preparing import" value={null} />
      </div>
    </Case>
  );
}
export function PaginationCase() {
  const [page, setPage] = createSignal(1);
  return (
    <Case
      title="Pagination"
      note="controlled; first, middle, and last pages remain reachable"
    >
      <Row label={`page ${page()} of 24`}>
        <Pagination page={page()} totalPages={24} onPageChange={setPage} />
      </Row>
      <Text size="sm" tone="muted">
        Previous and Next stop at the boundaries. For a single page, the
        component renders no navigation.
      </Text>
      <Pagination
        page={1}
        totalPages={1}
        onPageChange={setPage}
        label="Single page example"
      />
    </Case>
  );
}
