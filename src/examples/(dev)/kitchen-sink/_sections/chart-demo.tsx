import { createSignal, For } from "solid-js";
import type { ChartSeries } from "~/components/charts";
import { ChartFrame, ChartLegend, LineChart } from "~/components/charts";
import { Mock } from "~/components/display";
import { Button } from "~/components/forms";
const series: readonly ChartSeries[] = [
  {
    key: "current",
    label: "This period",
    tone: "accent",
  },
  {
    key: "previous",
    label: "Previous period",
    tone: "info",
    line: "dashed",
  },
];
const values = [18, 24, 21, 31, 28, 35, 42, 38, 46, 43, 51, 48, 58, 64];
const data = values.map((value, index) => ({
  label: `Sep ${index + 1}`,
  values: {
    current: value,
    previous: Math.round(value * 0.7) + (index % 3) * 3,
  },
}));
export function ChartDemo() {
  const [days, setDays] = createSignal(7);
  return (
    <ChartFrame
      title="Completed work"
      description="Items completed per day, compared with the previous period."
      actions={
        <div role="group" aria-label="Chart period">
          <For each={[7, 14]}>
            {(period) => (
              <Button
                size="sm"
                intent={days() === period ? "secondary" : "ghost"}
                aria-pressed={days() === period}
                onClick={() => setDays(period)}
              >
                {period} days
              </Button>
            )}
          </For>
        </div>
      }
      legend={<ChartLegend series={series} />}
      footer={
        <Mock note="Illustrative measurements, generated locally for this example." />
      }
    >
      <LineChart
        label={`Completed work over ${days()} days`}
        data={data.slice(-days())}
        series={series}
      />
    </ChartFrame>
  );
}
