import {
  BubblePlot,
  ColourBar,
  Legend,
  Matrix,
  NothingKey,
  RankedBar,
  Volcano,
  categorical,
  coverageOf,
} from "~/components/charts";
import { Text } from "~/components/typography";
import { Case, Row, Section } from "../_components/section";
import { readSources } from "../_lib/source";
import { ASSETS, CHECKS, bars, bubbles, cell, volcano } from "./chart-fixtures";
import { MatrixSelectionDemo } from "./chart-selection-demo";
export function StatisticalChartsSection() {
  const [
    volcanoSources,
    bubbleSources,
    barSources,
    matrixSources,
    legendSources,
  ] = [
    readSources([
      "charts/volcano/volcano.tsx",
      "charts/plot-frame/plot-frame.tsx",
    ]),
    readSources([
      "charts/bubble-plot/bubble-plot.tsx",
      "charts/_kernel/encode.ts",
    ]),
    readSources([
      "charts/ranked-bar/ranked-bar.tsx",
      "charts/plot-frame/plot-frame.tsx",
    ]),
    readSources(["charts/matrix/matrix.tsx", "charts/_kernel/encode.ts"]),
    readSources(["charts/legend/legend.tsx", "charts/_kernel/encode.ts"]),
  ];
  const coverage = coverageOf(ASSETS, CHECKS, cell);
  return (
    <Section
      id="statistical-charts"
      title="Statistical charts"
      blurb="The statistical family from Overwatch: shared axes and encodings, specialized marks, and a coverage matrix that keeps different kinds of absence distinct. All examples use illustrative data."
    >
      <Case
        title="Volcano"
        note="effect against significance; three states and grey is one of them"
        sources={volcanoSources}
      >
        <Volcano
          points={volcano}
          labelled={["g3", "g17", "g44"]}
          title="Differential expression"
        />
      </Case>

      <Case
        title="Bubble plot"
        note="area is the third variable, and it is AREA not radius"
        sources={bubbleSources}
      >
        <BubblePlot
          bubbles={bubbles}
          xLabel="enrichment"
          yLabel="−log₁₀ q"
          categories={["KEGG", "Reactome", "GO"]}
        />
        <Legend
          items={[
            {
              label: "KEGG",
              fill: categorical(0),
            },
            {
              label: "Reactome",
              fill: categorical(1),
            },
            {
              label: "GO",
              fill: categorical(2),
            },
          ]}
        />
      </Case>

      <Case
        title="Ranked bar"
        note="sorted by the component, because the order is the finding"
        sources={barSources}
      >
        <RankedBar bars={bars} yLabel="degree" />
      </Case>

      <Case
        title="Matrix"
        note="the one with a caller — three kinds of nothing, and `n/a` is excluded from the ratio"
        sources={matrixSources}
      >
        <Matrix
          rows={ASSETS}
          columns={CHECKS}
          cell={cell}
          ramp="sequential"
          title="Coverage"
        />
        <NothingKey />
        <Row label="ratio">
          <Text as="span" size="sm" tone="quiet">
            {coverage
              ? `${coverage.checked} of ${coverage.applicable} applicable · ${(coverage.ratio * 100).toFixed(0)}%`
              : "– nothing applicable"}
            {" — the three n/a cells are in neither half of that fraction."}
          </Text>
        </Row>
      </Case>

      <Case
        title="Colour bar"
        note="stepped scale with a labelled range and midpoint"
        sources={legendSources}
      >
        <Row label="sequential">
          <ColourBar kind="sequential" domain={[0, 100]} label="coverage %" />
        </Row>
        <Row label="diverging">
          <ColourBar kind="diverging" domain={[-1, 1]} label="correlation" />
        </Row>
      </Case>

      <Case
        title="Matrix selection"
        note="inspect a cell with a pointer, Enter, Space, or its data table"
      >
        <MatrixSelectionDemo />
      </Case>
      <Case title="Empty plots" note="an empty input has an explicit answer">
        <Volcano points={[]} />
        <BubblePlot bubbles={[]} />
        <RankedBar bars={[]} />
        <Matrix
          rows={[]}
          columns={[]}
          cell={() => ({
            state: "na",
          })}
        />
      </Case>
      <Case
        title="Unavailable measurements"
        note="invalid readings retain their records without becoming zeros or marks"
      >
        <Volcano
          title="Unavailable effects"
          points={[
            {
              id: "effect",
              x: NaN,
              y: 2,
            },
          ]}
        />
        <BubblePlot
          title="Unavailable weights"
          bubbles={[
            {
              id: "weight",
              x: 1,
              y: 2,
              weight: -1,
            },
          ]}
        />
        <RankedBar
          title="Unavailable totals"
          bars={[
            {
              id: "total",
              label: "Total",
              value: Infinity,
            },
          ]}
        />
        <Matrix
          title="Unavailable coverage"
          rows={["Atlas"]}
          columns={["Checks"]}
          cell={() => ({
            state: "value",
            value: NaN,
          })}
          width={320}
          height={180}
        />
      </Case>
    </Section>
  );
}
