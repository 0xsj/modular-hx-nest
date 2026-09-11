/** The executable policy is data. Detectors live in check.mjs; review stays open. */
export const POLICY = {
  roots: ["src"],
  portable: {
    kernel: ["kernel"],
    diagnostics: ["diagnostics", "kernel"],
    "url-state": ["url-state", "kernel"],
    storage: ["storage", "kernel"],
    locale: ["locale", "kernel"],
    realtime: ["realtime", "kernel"],
    http: ["http", "diagnostics", "kernel"],
    chaos: ["chaos", "http", "kernel"],
    services: ["services", "http", "kernel"],
    root: [
      "root",
      "services",
      "http",
      "chaos",
      "diagnostics",
      "storage",
      "kernel",
    ],
  },
  frameworks: [
    "react",
    "react-dom",
    "next",
    "svelte",
    "solid-js",
    "@solidjs",
    "@ark-ui",
    "@tanstack",
    "radix-ui",
    "@radix-ui",
    "react-aria",
    "react-stately",
    "react-aria-components",
  ],
  libraryOwners: [
    {
      packages: ["lucide-solid"],
      paths: ["src/components/utility/icon/icon.ts"],
      reason: "One inventory of named icon exports.",
    },
    {
      packages: ["@ark-ui/solid"],
      paths: [
        "src/components/forms/",
        "src/components/display/",
        "src/components/layout/",
        "src/components/navigation/",
        "src/components/disclosure/",
        "src/components/overlays/",
        "src/components/utility/",
      ],
      reason: "Behavior libraries belong inside primitive wrappers.",
    },
    {
      packages: ["@ark-ui/solid"],
      paths: ["src/components/chrome/segmented.tsx"],
      reason:
        "This file is the shared preference-choice primitive, despite its chrome location.",
    },
    {
      packages: ["@internationalized/date"],
      paths: [
        "src/components/forms/date-picker/",
        "src/components/forms/date-range-picker/",
      ],
      reason: "Calendar objects stay behind the date-string adapter.",
    },
    {
      packages: ["@tanstack/solid-query"],
      paths: ["src/lib/query/"],
      reason: "The query binding owns the cache library.",
    },
    {
      packages: ["cytoscape"],
      paths: ["src/components/charts/_kernel/"],
      reason: "Graph layout is confined to the chart layout adapter.",
    },
  ],
  exceptions: [
    {
      rule: "S4",
      path: "src/components/chrome/",
      target: "src/lib/runtime/",
      reason:
        "Preference bindings intentionally connect chrome to the local runtime store.",
    },
  ],
};

/**
 * @typedef {Object} Rule
 * @property {string} id
 * @property {"mechanical" | "review"} mode
 * @property {string} scope
 * @property {string} statement
 * @property {string} detect
 * @property {string} message
 * @property {string} exempt
 * @property {string} limits
 * @property {string} [disabledReason]
 */

/** @type {Rule[]} */
export const RULES = [
  {
    id: "S1",
    mode: "mechanical",
    scope: "Portable lib tiers",
    statement:
      "Portable tiers contain no framework dependencies or runtime directives.",
    detect:
      "Parse module references and directive prologues in the configured portable tiers.",
    message: "Keep the portable tier framework independent.",
    exempt:
      "Tests and declarations; lib/query and lib/runtime are framework bindings.",
    limits:
      "Computed module names and arbitrary dependency internals need review.",
  },
  {
    id: "S2",
    mode: "mechanical",
    scope: "Portable lib tiers",
    statement:
      "Portable local dependencies follow the declared tier edges and use relative paths.",
    detect:
      "Resolve local modules with TypeScript; compare their tiers to POLICY.portable and flag project aliases.",
    message: "Use a relative import into an allowed portable tier.",
    exempt:
      "Same-tier imports; root may compose services, adapters, and chaos.",
    limits:
      "This does not detect cycles or decide whether a permitted dependency is useful.",
  },
  {
    id: "S3",
    mode: "mechanical",
    scope: "All production sources",
    statement: "Third-party behavior is accessed through its declared owners.",
    detect:
      "Compare import, re-export, literal import(), require(), and import-type references with libraryOwners.",
    message:
      "Import the existing wrapper or binding; this file does not own that library.",
    exempt:
      "Exact/prefix owners and their reasons are in POLICY.libraryOwners.",
    limits:
      "A permitted wrapper can still leak a vendor-specific public API; review the contract.",
  },
  {
    id: "S4",
    mode: "mechanical",
    scope: "Components",
    statement:
      "Reusable components do not import application routes or backend/domain/runtime bindings.",
    detect:
      "Resolve component imports into app/ and lib/; allow kernel plus explicit exceptions.",
    message: "Pass data and behavior into the component from its caller.",
    exempt: "Kernel utilities and the declared chrome/runtime exception.",
    limits:
      "Domain vocabulary and excessive prop branching need contextual review.",
  },
  {
    id: "S5",
    mode: "mechanical",
    scope: "All production sources",
    statement: "The composition root owns adapter construction.",
    detect:
      "Resolve factory call signatures to createFetchClient/createMemoryClient in lib/http.",
    message: "Construct the adapter through lib/root.",
    exempt: "Adapter internals and lib/root; tests are excluded.",
    limits:
      "Calls erased to any or made through runtime indirection may escape detection.",
  },
  {
    id: "S6",
    mode: "mechanical",
    scope: "All production sources",
    statement: "Services and transport adapters own transport operations.",
    detect:
      "Resolve calls to HttpClient methods declared in lib/http/port.ts and native fetch declarations.",
    message: "Call a service instead of issuing a transport operation here.",
    exempt:
      "src/lib/http, lib/services, lib/chaos, and lib/root own transport behavior.",
    limits:
      "Untyped clients, reflection, and alternate networking APIs require review. Navigation URLs are allowed.",
  },
  {
    id: "E1",
    mode: "mechanical",
    scope: "Server functions",
    statement:
      "A server function does not return Result instances, including inside other data.",
    detect:
      "Inspect inferred/annotated exported server-function return types, inline server functions, promises, unions, arrays, and object properties for kernel Ok/Err types.",
    message:
      "Convert the Result to the application's plain boundary state before returning.",
    exempt:
      "Ordinary service functions and local helpers that are not server functions.",
    limits:
      "Any/unknown, callable values, recursive/deep objects, and client-prop serialization are review gaps, not proofs of safety.",
  },
  {
    id: "A1",
    mode: "mechanical",
    scope: "TSX/JSX sources",
    statement:
      "React hydration-suppression props do not belong in Solid components.",
    detect:
      "Inspect explicit JSX attributes and literal object spreads for suppressHydrationWarning.",
    message:
      "Resolve the mismatch instead of suppressing it outside src/entry-server.tsx.",
    exempt:
      "src/examples/layout.tsx owns the intentional theme/density hydration seam.",
    limits: "Dynamically constructed/spread props require review.",
  },
  {
    id: "C1",
    mode: "review",
    scope: "Changed UI and related components",
    statement:
      "Reuse existing contracts and keep duplicated knowledge in one place.",
    detect:
      "Agent compares public component contracts, raw-control leads, and repeated JSX structures.",
    message:
      "Identify the existing component and show why its contract fits before recommending reuse.",
    exempt:
      "Native markup inside wrappers; deliberate examples; similar layouts with different reasons to change.",
    limits:
      "Structural similarity is a lead. It does not establish semantic duplication.",
  },
  {
    id: "E2",
    mode: "review",
    scope: "Changed operations and their consumers",
    statement:
      "Failures retain their meaning, render at the right scope, and offer appropriate recovery.",
    detect:
      "Agent traces operation → Result/Failure → boundary → UI → recovery; inspect catch/fallback leads and actual failure branches.",
    message: "Show the failure path and the user-visible consequence.",
    exempt:
      "Explicitly documented fallbacks appropriate to that caller's task.",
    limits:
      "Source cannot prove a backend's behavior or replace failure-case tests.",
  },
  {
    id: "C2",
    mode: "review",
    scope: "Changed component contracts and callers",
    statement:
      "Components have coherent responsibilities with caller-owned domain behavior.",
    detect:
      "Agent inspects public props, slots, state ownership, dependencies, and representative callers.",
    message:
      "Explain the responsibility being mixed or the concrete call site the abstraction improves.",
    exempt:
      "Purposeful interactive primitives own their local behavior; repetition alone does not demand extraction.",
    limits:
      "Component count, prop count, and file length are not correctness metrics.",
  },
  {
    id: "T1",
    mode: "review",
    scope: "Changed UI and styles",
    statement:
      "Use the design system's tokens and preserve accessible interaction and distinct data states.",
    detect:
      "Agent reviews styles/markup and runs relevant browser checks; inspect pending/empty/failed/unmeasured states.",
    message:
      "Name the token or behavior, show the render evidence, and state what was not tested.",
    exempt:
      "Geometry, data-driven coordinates, and measurements without an appropriate token.",
    limits:
      "The CLI does not measure appearance, run axe, or operate assistive technology.",
  },
];

export function validateRules(rules, policy, detectorIds) {
  const seen = new Set();
  for (const rule of rules) {
    if (seen.has(rule.id)) throw new Error(`Duplicate rule ${rule.id}`);
    seen.add(rule.id);
    for (const field of [
      "id",
      "scope",
      "statement",
      "detect",
      "message",
      "exempt",
      "limits",
    ]) {
      if (typeof rule[field] !== "string" || !rule[field].trim())
        throw new Error(`Rule ${rule.id} needs ${field}`);
    }
    if (!["mechanical", "review"].includes(rule.mode))
      throw new Error(`Unknown rule mode: ${rule.id}`);
    if (
      rule.disabledReason !== undefined &&
      (typeof rule.disabledReason !== "string" || !rule.disabledReason.trim())
    )
      throw new Error(`Rule ${rule.id} needs a reason to be disabled`);
    if (rule.mode === "mechanical" && !detectorIds.includes(rule.id))
      throw new Error(`No detector implements ${rule.id}`);
  }
  for (const id of detectorIds)
    if (!rules.some((rule) => rule.id === id && rule.mode === "mechanical"))
      throw new Error(`Detector ${id} has no rule`);
  for (const owner of policy.libraryOwners) {
    if (!owner.reason?.trim() || !owner.packages.length || !owner.paths.length)
      throw new Error("Library owners need packages, paths, and a reason");
  }
  for (const exception of policy.exceptions) {
    if (
      !seen.has(exception.rule) ||
      !exception.path ||
      !exception.target ||
      !exception.reason?.trim()
    )
      throw new Error("Exceptions need a known rule, path, target, and reason");
  }
}
