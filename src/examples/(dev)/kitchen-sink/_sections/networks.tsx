import {
  BipartiteNetwork,
  CircularNetwork,
  CliqueNetwork,
  CorrelationNetwork,
  EnrichmentMap,
  FlowNetwork,
  ForceNetwork,
  GraphFrame,
  HairballNetwork,
  Legend,
  ModuleNetwork,
  MultipartiteNetwork,
  RadialNetwork,
  categorical,
} from "~/components/charts";
import { Text } from "~/components/typography";
import { Case, Section } from "../_components/section";
import { readSources } from "../_lib/source";
import { bipartite, correlation, net, star } from "./chart-fixtures";
import { NetworkSelectionDemo } from "./chart-selection-demo";
export function NetworksSection() {
  const sources = readSources([
    "charts/network-presets/network-presets.tsx",
    "charts/graph-frame/graph-frame.tsx",
    "charts/_kernel/layout-cose.ts",
  ]);
  return (
    <Section
      id="networks"
      title="Network diagrams"
      blurb="Eleven presets from Overwatch over one graph frame. Layout communicates structure; shapes, signed edges, and labelled group annotations add meaning. These are SVG diagrams with exact records alongside them."
    >
      <Case
        title="Network selection"
        note="inspect a node and its neighbors without changing the layout"
      >
        <NetworkSelectionDemo />
      </Case>
      <Case
        title="Force network"
        note="position is a hint, and the layout is seeded so it never reshuffles"
        sources={sources}
      >
        <ForceNetwork
          {...net(70, 3, 1.9)}
          width={520}
          height={360}
          labels={false}
        />
      </Case>

      <Case
        title="Radial network"
        note="the ring IS hops from the centre — the only layout you can read off"
        sources={sources}
      >
        <RadialNetwork {...star} rootId="root" width={520} height={340} />
      </Case>

      <Case
        title="Circular network"
        note="position means nothing, and nothing is ever hidden"
        sources={sources}
      >
        <CircularNetwork {...net(18, 9, 1.3)} width={420} height={340} />
      </Case>

      <Case
        title="Bipartite"
        note="shape carries the class, so it survives being printed"
        sources={sources}
      >
        <BipartiteNetwork
          {...bipartite}
          width={420}
          height={260}
          groupOrder={[0, 1]}
        />
      </Case>

      <Case
        title="Multipartite"
        note="the same function with more tiers"
        sources={sources}
      >
        <MultipartiteNetwork
          nodes={net(21, 13).nodes}
          edges={net(21, 13).edges}
          groupOrder={[0, 1, 2]}
          width={460}
          height={300}
        />
      </Case>

      <Case
        title="Flow"
        note="columns by longest path; the only layout with no trigonometry in it"
        sources={sources}
      >
        <FlowNetwork
          nodes={[
            {
              id: "subfinder",
              label: "subfinder",
              size: 7,
              fill: categorical(0),
            },
            {
              id: "httpx",
              label: "httpx",
              size: 6,
              fill: categorical(0),
            },
            {
              id: "tlsx",
              label: "tlsx",
              size: 6,
              fill: categorical(1),
            },
            {
              id: "naabu",
              label: "naabu",
              size: 6,
              fill: categorical(1),
            },
            {
              id: "nuclei",
              label: "nuclei",
              size: 7,
              fill: categorical(3),
            },
          ]}
          edges={[
            {
              from: "subfinder",
              to: "httpx",
            },
            {
              from: "subfinder",
              to: "tlsx",
            },
            {
              from: "subfinder",
              to: "naabu",
            },
            {
              from: "httpx",
              to: "nuclei",
            },
          ]}
          width={460}
          height={220}
        />
      </Case>

      <Case
        title="Clique"
        note="density is the result; circular makes every edge visible"
        sources={sources}
      >
        <CliqueNetwork {...net(9, 31, 3.4)} width={360} height={300} />
      </Case>

      <Case
        title="Hairball"
        note="labels off — at this density they are a grey wash"
        sources={sources}
      >
        <HairballNetwork {...net(140, 17, 3.2)} width={520} height={380} />
        <Text size="sm" tone="quiet">
          This shows overall density. Pair it with a ranked bar or table when
          the reader needs to compare individual nodes.
        </Text>
      </Case>

      <Case
        title="Enrichment map"
        note="hulls are an annotation layer, drawn and named by a person"
        sources={sources}
      >
        <EnrichmentMap
          {...net(46, 41, 1.5)}
          width={520}
          height={360}
          hulls={[
            {
              ids: ["n0", "n1", "n2", "n3", "n4"],
              label: "axon guidance",
            },
            {
              ids: ["n10", "n11", "n12", "n13"],
              label: "lipid metabolism",
              fill: "var(--chart-2)",
            },
          ]}
        />
      </Case>

      <Case
        title="Module network"
        note="rings around the parts worth naming; the nodes were already there"
        sources={sources}
      >
        <ModuleNetwork
          {...net(64, 53, 2.0)}
          width={520}
          height={360}
          hulls={[
            {
              ids: ["n2", "n5", "n8", "n11"],
              label: "cluster 1",
              fill: "var(--chart-4)",
            },
          ]}
        />
      </Case>

      <Case
        title="Correlation network"
        note="hue is the sign; a missing edge is below the cut, not a zero"
        sources={sources}
      >
        <CorrelationNetwork {...correlation} width={420} height={300} />
        <Legend
          items={[
            {
              label: "positive",
              fill: "var(--chart-pos)",
            },
            {
              label: "negative",
              fill: "var(--chart-neg)",
            },
          ]}
        />
      </Case>

      <Case
        title="Small and empty networks"
        note="a single node and an empty graph remain valid inputs"
      >
        <GraphFrame
          title="Single node"
          nodes={[
            {
              id: "solo",
              label: "Only node",
            },
          ]}
          edges={[]}
          width={320}
          height={180}
          layout="circular"
        />
        <GraphFrame
          title="Empty graph"
          nodes={[]}
          edges={[]}
          width={320}
          height={180}
        />
      </Case>
    </Section>
  );
}
