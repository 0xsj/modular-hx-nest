import type { ChartSeries } from "~/components/charts";
import {
  BarChart,
  ChartFrame,
  ChartLegend,
  LineChart,
} from "~/components/charts";
import { Panel } from "~/components/display";
import { Case, Section } from "../_components/section";
import s from "../_components/sink.module.css";
import { readSources } from "../_lib/source";
import { ChartDemo } from "./chart-demo";
const balance: readonly ChartSeries[] = [
  {
    key: "balance",
    label: "Net change",
    tone: "accent",
  },
];
export function ChartsSection() {
  return (
    <Section
      id="charts"
      title="Charts"
      blurb="Small, dependency-free charts for ordinary metrics, with exact values available as text. ChartFrame and ChartLegend also compose around a richer chart engine when a product needs one."
    >
      <Case
        title="Chart frame and line series"
        note="named series, distinct strokes, range controls, and a data table"
        sources={readSources([
          "charts/chart-frame/chart-frame.tsx",
          "charts/line-chart/line-chart.tsx",
          "charts/doc.ts",
        ])}
      >
        <ChartDemo />
      </Case>
      <Case
        title="Bar chart"
        note="ranked categories; zero is a measured value"
      >
        <ChartFrame
          title="Projects by team"
          description="Counts are printed beside each bar. Unavailable measurements have no invented value."
        >
          <BarChart
            label="Projects by team"
            data={[
              {
                label: "Engineering",
                value: 28,
              },
              {
                label: "Operations",
                value: 17,
              },
              {
                label: "Design",
                value: 9,
              },
              {
                label: "Research",
                value: 0,
              },
              {
                label: "External partners",
                value: null,
              },
            ]}
          />
        </ChartFrame>
      </Case>
      <Case
        title="Missing and negative values"
        note="a missing measurement breaks the line; it never becomes zero"
      >
        <ChartFrame
          title="Net member change"
          legend={<ChartLegend series={balance} />}
          footer="Wednesday is unavailable. Thursday was measured and its change was zero."
        >
          <LineChart
            label="Net member change"
            series={balance}
            data={[
              {
                label: "Mon",
                values: {
                  balance: 5,
                },
              },
              {
                label: "Tue",
                values: {
                  balance: -3,
                },
              },
              {
                label: "Wed",
                values: {
                  balance: null,
                },
              },
              {
                label: "Thu",
                values: {
                  balance: 0,
                },
              },
              {
                label: "Fri",
                values: {
                  balance: 4,
                },
              },
            ]}
          />
        </ChartFrame>
      </Case>
      <Case
        title="Small and empty datasets"
        note="one point, a constant series, no rows, and no measurements"
      >
        <div class={s.chartGrid}>
          <Panel title="Single measurement">
            <LineChart
              label="Single measurement"
              series={balance}
              data={[
                {
                  label: "Today",
                  values: {
                    balance: 4,
                  },
                },
              ]}
            />
          </Panel>
          <Panel title="Constant zero">
            <LineChart
              label="Constant zero"
              series={balance}
              data={[
                {
                  label: "Mon",
                  values: {
                    balance: 0,
                  },
                },
                {
                  label: "Tue",
                  values: {
                    balance: 0,
                  },
                },
                {
                  label: "Wed",
                  values: {
                    balance: 0,
                  },
                },
              ]}
            />
          </Panel>
          <Panel title="No rows">
            <BarChart label="No rows" data={[]} />
            <LineChart label="No line rows" series={balance} data={[]} />
          </Panel>
          <Panel title="Unavailable">
            <LineChart
              label="Unavailable measurements"
              series={balance}
              data={[
                {
                  label: "Mon",
                  values: {
                    balance: null,
                  },
                },
                {
                  label: "Tue",
                  values: {
                    balance: null,
                  },
                },
              ]}
            />
            <BarChart
              label="Invalid measurements"
              data={[
                {
                  label: "Missing",
                  value: null,
                },
                {
                  label: "Invalid",
                  value: Number.NaN,
                },
              ]}
            />
          </Panel>
        </div>
      </Case>
    </Section>
  );
}
