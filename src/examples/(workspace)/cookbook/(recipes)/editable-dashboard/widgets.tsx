import { BarChart, LineChart } from "~/components/charts";
import { Stat } from "~/components/display";
import { Text } from "~/components/typography";
import type { DashboardLayout } from "~/components/workspaces";
export const DEFAULT_LAYOUT: DashboardLayout = [
  {
    id: "requests",
    x: 0,
    y: 0,
    width: 6,
    height: 4,
  },
  {
    id: "latency",
    x: 6,
    y: 0,
    width: 6,
    height: 4,
  },
  {
    id: "throughput",
    x: 0,
    y: 4,
    width: 8,
    height: 7,
  },
  {
    id: "workload",
    x: 8,
    y: 4,
    width: 4,
    height: 7,
  },
];
export const WIDGETS = [
  {
    id: "requests",
    title: "Requests",
    content: () => (
      <Stat
        label="This week"
        value="24,891"
        hint="Sample data · up 12.4% from last week"
      />
    ),
  },
  {
    id: "latency",
    title: "Response time",
    content: () => (
      <Stat
        label="Median latency"
        value="128 ms"
        hint="Sample data · down 18 ms from last week"
      />
    ),
  },
  {
    id: "throughput",
    title: "Throughput",
    content: () => (
      <LineChart
        label="Daily requests"
        series={[
          {
            key: "requests",
            label: "Requests",
            tone: "accent",
          },
        ]}
        data={[
          {
            label: "Mon",
            values: {
              requests: 2800,
            },
          },
          {
            label: "Tue",
            values: {
              requests: 3200,
            },
          },
          {
            label: "Wed",
            values: {
              requests: 2900,
            },
          },
          {
            label: "Thu",
            values: {
              requests: 4100,
            },
          },
          {
            label: "Fri",
            values: {
              requests: 3800,
            },
          },
          {
            label: "Sat",
            values: {
              requests: 4300,
            },
          },
          {
            label: "Sun",
            values: {
              requests: 3791,
            },
          },
        ]}
      />
    ),
  },
  {
    id: "workload",
    title: "Workload",
    content: () => (
      <BarChart
        label="Jobs by state"
        data={[
          {
            label: "Done",
            value: 84,
          },
          {
            label: "Active",
            value: 24,
          },
          {
            label: "Queued",
            value: 12,
          },
        ]}
      />
    ),
  },
  {
    id: "capacity",
    title: "Capacity",
    content: () => (
      <Stat
        label="Available capacity"
        value="38%"
        hint="Sample data · enough room for the next batch"
      />
    ),
  },
  {
    id: "notes",
    title: "Workspace note",
    content: () => (
      <Text>
        Start with the signals that matter to your team. Remove the rest, and
        leave room for the next question.
      </Text>
    ),
  },
] as const;
