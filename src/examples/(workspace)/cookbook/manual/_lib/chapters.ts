import type { FailureKind } from "~/lib/kernel";
import type { ManualChapter } from "./types";

const failureGuide: Record<FailureKind, [string, string]> = {
  unauthenticated: [
    "Identity is missing or no longer accepted.",
    "Recover the session; keep an unresolved write unresolved.",
  ],
  forbidden: [
    "This operation is not permitted.",
    "Explain the refusal and refresh capabilities when appropriate.",
  ],
  rate_limited: [
    "The caller must wait.",
    "Honor retryAfter (seconds). A write still needs a safe retry policy.",
  ],
  unavailable: [
    "The dependency could not serve the request.",
    "Retry eligible reads; retain useful data within its ownership scope.",
  ],
  timeout: [
    "The request exceeded its deadline.",
    "Retry eligible reads; reconcile a write that may have committed.",
  ],
  canceled: [
    "Local observation was interrupted.",
    "Avoid treating it as a server outage. A write may still need reconciliation.",
  ],
  internal: [
    "An unexpected condition or contract mismatch occurred.",
    "Show an appropriate regional or screen error and a useful reference.",
  ],
  not_found: [
    "A requested resource is absent.",
    "Render missing-resource state; only explicit absence contracts become null.",
  ],
  invalid: [
    "Input violates the operation's rules.",
    "Place fields beside the matching submitted inputs and preserve the draft.",
  ],
  conflict: [
    "The input is valid but conflicts with current state.",
    "Explain what changed; refresh or resolve before another attempt.",
  ],
};

export const chapters: ManualChapter[] = [
  {
    slug: "orientation",
    title: "Start with the shape",
    description:
      "What Flover gives you, what you own, and how to use the template.",
    sections: [
      {
        id: "purpose",
        title: "A starting point with explicit choices",
        blocks: [
          {
            kind: "text",
            text: "Flover is a standalone frontend template. Its useful unit is a complete interaction: a composed screen calls an operation, receives a validated value or a meaningful failure, and offers recovery appropriate to that outcome. The cookbook demonstrates those interactions; your product starts on the separate app canvas.",
          },
          {
            kind: "text",
            text: "The Result shape is influenced by Rust-style errors as values, while cause chains make contextual wrapping familiar to Go users. Ports, adapters and composition roots are established ideas. The distinctive part here is applying them consistently across services, framework boundaries, recovery state, fixtures and UI composition.",
          },
          {
            kind: "links",
            items: [
              {
                href: "/app",
                label: "Your app canvas",
                description: "Start product work here. Requires sign-in.",
              },
              {
                href: "/kitchen-sink",
                label: "Component catalog",
                description:
                  "Inspect existing primitives and compositions before creating another.",
              },
              {
                href: "/cookbook/items?item=api",
                label: "A complete item workflow",
                description:
                  "Follow one interaction from browsing to draft recovery. Requires sign-in.",
              },
            ],
          },
        ],
      },
      {
        id: "first-product",
        title: "Start a product without inheriting every demo",
        blocks: [
          {
            kind: "list",
            items: [
              "Build the first real route in src/routes/(workspace)/app.tsx and register its navigation in src/examples/(workspace)/_lib/navigation.ts.",
              "Reuse a component from components/ when its contract fits. Keep product data, permissions and operations with the product route or service.",
              "Move a proven recipe composition into your product deliberately. Product routes should not depend on cookbook implementations.",
              "Keep the portable modules you need. Remove examples and optional protocols when they no longer serve the product.",
            ],
          },
          {
            kind: "callout",
            title: "Enough foundation to start",
            text: "Use a real feature to test the architecture before adding another general-purpose subsystem. A module earns its place when a caller exposes a behavior or failure that existing contracts cannot express.",
          },
        ],
      },
      {
        id: "reading-map",
        title: "Choose a reading path",
        blocks: [
          {
            kind: "table",
            caption: "Read according to the work",
            headings: ["Your task", "Start with"],
            rows: [
              ["Understand why the directories exist", "Layers and ownership"],
              [
                "Implement a service or handle a refusal",
                "Results and failures",
              ],
              ["Build a new screen", "Add a feature"],
              [
                "Connect Go, NestJS, Supabase or another provider",
                "Connect a backend",
              ],
              [
                "Keep state correct through interruptions",
                "State and recovery",
              ],
              ["Review an agent's work", "Verification and specifications"],
            ],
          },
          {
            kind: "sources",
            items: [
              {
                path: "README.md",
                why: "Run commands, cookbook routes and current scope.",
              },
              {
                path: "docs/manual/README.md",
                why: "Repository reading map with links to implementation contracts and protocols.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "layers",
    title: "Layers and ownership",
    description:
      "Place knowledge where it belongs, and keep the seams replaceable.",
    sections: [
      {
        id: "request-path",
        title: "Follow one request",
        blocks: [
          {
            kind: "code",
            label: "Runtime call flow; the root supplies the selected client",
            language: "text",
            code: "Page / framework binding\n  → service(client, input, options)\n    → HttpClient port\n      → selected fetch or memory adapter\n\nAdapter: wire / transport → Result<unknown, Failure>\nService: unknown → validated domain value\nBinding: Result → plain UI state or an edge exception\nView: data, regional failure, or recovery action",
          },
          {
            kind: "text",
            text: "The composition root wires dependencies; it is not another business operation every response passes through. A service receives its client as the first argument. The view asks for an operation without choosing a transport, interpreting a status code, or naming an endpoint.",
          },
        ],
      },
      {
        id: "ownership",
        title: "Where each decision lives",
        blocks: [
          {
            kind: "table",
            caption: "Ownership map",
            headings: ["Location", "Owns", "Keep outside"],
            rows: [
              [
                "src/lib/kernel",
                "Result, Failure, cause chains and common classification",
                "Frameworks, transport and application policy",
              ],
              [
                "src/lib/http",
                "HttpClient, transport adapters, wire/status mapping and response-reader helpers",
                "Screen state and product-specific endpoint operations",
              ],
              [
                "src/lib/services/<domain>",
                "Endpoint operations, input rules, DTO readers and service failure contracts",
                "Adapter construction and Solid bindings",
              ],
              [
                "src/lib/root",
                "Adapter selection, domain wiring and isolated simulation roots",
                "Reading cookies or framework request context",
              ],
              [
                "src/lib/app",
                "Cookies, request context, server-root binding and serializable form state",
                "Portable service rules",
              ],
              [
                "src/lib/query · src/lib/runtime",
                "Cache bindings or explicit interaction state machines",
                "Endpoint strings in UI operations",
              ],
              [
                "components",
                "Owned vendor wrappers, primitives and reusable UI compositions",
                "Application services, account data and route policy",
              ],
              [
                "app routes",
                "Product composition, data ownership and regional recovery",
                "Parallel copies of existing component contracts",
              ],
            ],
          },
          {
            kind: "text",
            text: "This is a dependency graph, not a rule that every file must pass through every tier. Storage, realtime, diagnostics, locale and URL-state modules address separate concerns. The portable core files use relative imports and no framework dependencies. src/lib/query and Solid bindings in src/lib/runtime are bindings; the entire runtime directory is not promised to be framework-free.",
          },
        ],
      },
      {
        id: "composition",
        title: "Compose around a real responsibility",
        blocks: [
          {
            kind: "text",
            text: "A Card provides header, body, footer and action slots. A Table provides semantic table parts; the caller owns rows, filtering and selection. These contracts stay useful when a new product has different data. Product behavior does not need to move into a generic component just because its markup appears twice.",
          },
          {
            kind: "text",
            text: "Extract shared knowledge when callers must change together. The note, item and session recipes share the draft/receipt state machine. The item and session editors also share the item-specific draft factory. Their screens remain separate because their workflows have different responsibilities.",
          },
          {
            kind: "list",
            items: [
              "Import behavior libraries through the project's owned wrappers. Import icons through components/utility.",
              "Use CSS Modules and the existing tokens/cascade layers. Add a new shared component to the kitchen sink in the states its contract describes.",
              "For another framework port, preserve contracts and portable behavior while replacing framework bindings, component engines and route integration. A matching screenshot alone is not a behavioral port.",
            ],
          },
          {
            kind: "sources",
            items: [
              {
                path: "tools/architecture/rules.mjs",
                why: "Executable import policy and the limits of each detector.",
              },
              {
                path: "src/lib/root/index.ts",
                why: "Per-domain client selection.",
              },
              {
                path: "components/display/card/doc.ts",
                why: "The Card composition contract.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "results-and-failures",
    title: "Results and failures",
    description:
      "The vocabulary that keeps errors meaningful from transport to interface.",
    sections: [
      {
        id: "result",
        title: "A result is an outcome you must handle",
        blocks: [
          {
            kind: "text",
            text: "Result<T, E> is an Ok or Err class instance. Its ok discriminator narrows value or error. Services return it so expected failures stay in the operation's visible contract. map transforms a success, andThen composes another fallible step, and mapErr transforms a failure. A clear early return is often the best composition for dependent async work.",
          },
          {
            kind: "code",
            label:
              "Service composition excerpt · src/lib/services/example/example.api.ts",
            language: "ts",
            code: "const current = await getItem(client, id, options);\nif (!current.ok) return current;\n\nreturn (await client.patch<unknown>(\n  `/items/${encodeURIComponent(id)}`,\n  { body: { name, host: current.value.host },\n    signal: options?.signal, trace: options?.trace },\n))\n  .andThen(value => decodeItem(value, options?.trace))\n  .mapErr(asRead);",
          },
          {
            kind: "callout",
            title: "A TypeScript generic is not a response check",
            text: "client.get<Item>() does not validate JSON. Request unknown, then decode and project the consumed fields before exposing an Item. Malformed successful payloads become internal / invalid_response instead of trusted domain objects.",
          },
        ],
      },
      {
        id: "failure",
        title: "Failure is plain data with a closed vocabulary",
        blocks: [
          {
            kind: "text",
            text: "Failure has ten kinds. Seven are transport-wide and can occur on any call: unauthenticated, forbidden, rate_limited, unavailable, timeout, canceled and internal. Three are domain kinds: not_found, invalid and conflict. A backend-specific condition belongs in type, such as revision_mismatch or seat_limit_reached, rather than creating another top-level kind.",
          },
          {
            kind: "table",
            caption: "Failure kinds and recovery considerations",
            headings: ["Kind", "Meaning", "Typical response"],
            rows: Object.entries(failureGuide).map(
              ([kind, [meaning, response]]) => [kind, meaning, response],
            ),
          },
          {
            kind: "text",
            text: "kind describes the outcome; message explains it; type supplies more specific vocabulary. status is diagnostic metadata and stays out of application branching. requestId names a server request, correlationId groups an interaction, and cause retains context underneath a failure. UI placement is a separate decision: a conflict can belong beside a field without becoming invalid.",
          },
        ],
      },
      {
        id: "narrowing-and-absence",
        title: "Narrow promises without discarding evidence",
        blocks: [
          {
            kind: "code",
            label:
              "A read's failure contract · src/lib/services/example/example.api.ts",
            language: "ts",
            code: 'type ReadFailure = TransportFailure | Fails<"not_found">;\nconst asRead = narrow("not_found");\n\n// All transport failures pass through.\n// An unexpected domain failure becomes internal,\n// with the original failure preserved as its cause.',
          },
          {
            kind: "text",
            text: "narrow is a runtime contract check as well as a type tool. It cannot narrow away cancellation or rate limiting. A service that promises no domain failures uses narrow<never>(). Use because, chain and rootCause to attach or inspect context without replacing the original reason with an unstructured string.",
          },
          {
            kind: "text",
            text: "Absence needs its own contract. Result<T | null> can represent a successful lookup with no value; Err means the lookup failed. optional requires an explicit not_found predicate such as absentWhenType(NO_DEFAULT). A misspelled route must not silently become an empty state. presenceOf names found, empty and unmeasured at the render boundary.",
          },
        ],
      },
      {
        id: "edges",
        title: "Convert only at the boundary that needs it",
        blocks: [
          {
            kind: "list",
            items: [
              "A meaningful screen with one failed panel renders a regional failure and its recovery control.",
              "When the screen cannot function, an edge may use unwrap or AppError so the framework error boundary handles it. Framework caches also expect rejected promises; query bindings use unwrap at that seam.",
              "A Server Action unwraps the Result into plain FormState or redirects on success. Pass neither Ok/Err instances nor tokens to a client component.",
              "Failure itself is plain data. If the client needs specific failure information, send the intended plain boundary shape; production server exceptions may be redacted.",
              "asFailure recovers a Failure from an exception-shaped edge. It does not prove the operation was never committed.",
            ],
          },
          {
            kind: "text",
            text: "retryDelay classifies retry timing; it cannot establish that a write is safe to repeat. The query binding retries eligible reads with a cap and disables automatic mutation retries. An unknown write outcome needs reconciliation, even when its transport failure would be retryable for a read.",
          },
          {
            kind: "links",
            items: [
              {
                href: "/cookbook/failures",
                label: "Inspect the failure vocabulary",
                description:
                  "Kinds, narrowing, cause chains and render policy. Requires sign-in; injected chaos is a development feature.",
              },
              {
                href: "/cookbook/resilience",
                label: "Exercise uncertain outcomes",
                description:
                  "Malformed responses, obsolete reads and receipt reconciliation.",
              },
            ],
          },
          {
            kind: "sources",
            items: [
              {
                path: "src/lib/kernel/failure.ts",
                why: "Closed kinds, narrowing, causes and retry classification.",
              },
              {
                path: "src/lib/kernel/result.ts",
                why: "Result constructors and combinators.",
              },
              {
                path: "src/lib/kernel/optional.ts",
                why: "Explicit absence and presence states.",
              },
              {
                path: "src/lib/app/form-state.ts",
                why: "Plain form-boundary state and field placement.",
              },
              {
                path: "src/lib/query/client.ts",
                why: "Read retry limits and mutation policy.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "add-a-feature",
    title: "Add a feature",
    description:
      "A repeatable path from a behavior contract to a usable screen.",
    sections: [
      {
        id: "contract-first",
        title: "Write the behavior before the implementation",
        blocks: [
          {
            kind: "text",
            text: "Start with a small doc.ts beside the service or state model. Describe inputs, outputs, refusals, ownership and recovery. For an editable item, specify validation, revision conflict, duplicate operation handling, lost responses, newer input arriving during a save, and what a receipt lookup is allowed to conclude.",
          },
          {
            kind: "list",
            items: [
              "Decide which backend facts the operation requires. Put uncertainty into the shape instead of a comment beside unrelated booleans.",
              "Define public DTOs and an unknown-to-DTO reader. Reject malformed nested data and select only fields the caller needs.",
              "Choose the promised domain failure kinds. Preserve all transport kinds and define what a confirmed refusal means for this operation.",
            ],
          },
        ],
      },
      {
        id: "service",
        title: "Keep the operation portable",
        blocks: [
          {
            kind: "code",
            label:
              "Existing read operation · src/lib/services/example/example.api.ts",
            language: "ts",
            code: "export async function getItem(\n  client: HttpClient,\n  id: string,\n  options?: CallOptions,\n): Promise<Result<Item, ReadFailure>> {\n  return (await client.get<unknown>(\n    `/items/${encodeURIComponent(id)}`,\n    { signal: options?.signal, trace: options?.trace },\n  ))\n    .andThen(value => decodeItem(value, options?.trace))\n    .mapErr(asRead);\n}",
          },
          {
            kind: "text",
            text: "The service names and encodes the endpoint, threads cancellation/diagnostics, and decodes the result. It imports neither Solid nor an adapter constructor. The example's decoder and types live beside it; the shown body is an excerpt, not a complete new module.",
          },
          {
            kind: "text",
            text: "Implement fixtures that reproduce the same refusals and ownership rules. Register the domain's routes at the composition root. A missing fixture handler is an internal unserved_route error, not proof that a resource is absent.",
          },
        ],
      },
      {
        id: "bind-and-compose",
        title: "Bind once, compose the screen",
        blocks: [
          {
            kind: "table",
            caption: "Pick the binding for the behavior",
            headings: ["Need", "Use"],
            rows: [
              [
                "Server-rendered data",
                "serverRoot in src/lib/server/root.ts, then the service; choose screen or regional failure scope",
              ],
              [
                "Shared cached server data",
                "src/lib/query options and centralized keys; translate Result at the cache edge",
              ],
              [
                "Replaceable uncached read",
                "createLatestRead; bind its stable store snapshot to the framework",
              ],
              [
                "Draft with uncertain writes",
                "createSaveDraft with an injected save/find port, refusal rules and checkpoint policy",
              ],
              [
                "Session-changing form",
                "A Server Action that owns cookie changes and returns plain form state on refusal",
              ],
            ],
          },
          {
            kind: "text",
            text: "Compose Field, Input, Button, Card and the appropriate feedback surface. The route owns the draft's account/resource identity. Key or reconstruct the state model when ownership changes; previous data from another resource is not a loading fallback. Validation messages should stay attached to the submitted field value they describe.",
          },
        ],
      },
      {
        id: "finish",
        title: "Finish with evidence someone else can assess",
        blocks: [
          {
            kind: "list",
            items: [
              "Exercise loading, empty, failed, refused and successful states, plus interruption paths required by the contract.",
              "If you introduced a shared component, render its public states in the kitchen sink. Keep workflow demonstrations in the cookbook.",
              "Check the rendered interaction, keyboard/focus behavior and responsive layout. A passing build does not exercise an authenticated dynamic page.",
              "Record a transferable finding while it is fresh. Review the operation through its Result, framework boundary and recovery action.",
            ],
          },
          {
            kind: "links",
            items: [
              {
                href: "/cookbook/items?item=api",
                label: "Trace the complete item recipe",
                description:
                  "A concrete reference for this workflow, including reload recovery.",
              },
            ],
          },
          {
            kind: "sources",
            items: [
              {
                path: "src/lib/services/example/item-workflow.doc.ts",
                why: "Item behavior and backend receipt contract.",
              },
              {
                path: "src/lib/runtime/save-draft.doc.ts",
                why: "The shared draft state machine's guarantees.",
              },
              {
                path: "src/examples/(workspace)/cookbook/(recipes)/items/item-editor.tsx",
                why: "The actual UI composition and field-error handling.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "backends",
    title: "Connect a backend",
    description:
      "Swap an adapter while preserving the promises the UI depends on.",
    sections: [
      {
        id: "two-mappings",
        title: "Map both success and failure",
        blocks: [
          {
            kind: "text",
            text: "A Go or NestJS HTTP server can use the fetch adapter once paths, authentication and envelopes are aligned. A provider such as Supabase may need a transport adapter around its SDK, or a server-side bridge exposing the application's operations. The UI should receive the same service values and Failure vocabulary in either arrangement.",
          },
          {
            kind: "table",
            caption: "Adapter responsibilities",
            headings: ["Boundary", "Responsibility"],
            rows: [
              [
                "Successful response",
                "Service readers validate and project the provider payload into the DTO the application consumes.",
              ],
              [
                "Failed response",
                "The transport maps status, error documents and transport exceptions into Failure; backend-specific conditions go in type.",
              ],
              [
                "Different error envelope",
                "createFetchClient accepts decodeFailure. Supply it where the root constructs the adapter; createRoot does not currently expose that option directly.",
              ],
              [
                "SDK rather than HTTP",
                "Implement a compatible operation/transport boundary and normalize errors there. Keep provider calls out of components.",
              ],
              [
                "Authentication",
                "The framework binding owns session persistence; the root receives the caller's context. The current app uses an HttpOnly cookie and server-mediated authenticated calls.",
              ],
            ],
          },
        ],
      },
      {
        id: "gradual-adoption",
        title: "Graduate one domain at a time",
        blocks: [
          {
            kind: "code",
            label: "Server environment configuration · src/lib/server/root.ts",
            language: "sh",
            code: "API_BASE_URL=https://api.example.com\nAPI_SERVED_DOMAINS=session,ledger",
          },
          {
            kind: "text",
            text: "Without API_BASE_URL, the main root uses fixtures. With a base URL and no served-domain list, it selects the network for all registered domains. A subset keeps the remaining domains on their registered fixture routes. The current domain vocabulary is session, ledger and example; adding a product domain means updating that registry and its wiring.",
          },
          {
            kind: "callout",
            title: "Cookbook roots are intentionally separate",
            text: "The recovery, capability and job recipes use isolated simulators. Setting API_BASE_URL does not turn those demonstrations into production endpoints. Build a product root that supplies their documented ports with real operations when you adopt a recipe.",
          },
        ],
      },
      {
        id: "semantic-guarantees",
        title: "Matching an envelope is only part of compatibility",
        blocks: [
          {
            kind: "table",
            caption: "Frontend mitigation and required backend facts",
            headings: ["Frontend behavior", "Backend guarantee"],
            rows: [
              [
                "Check an uncertain save before another attempt",
                "Account-scoped operation identity, deduplication/receipt matching, and authoritative final status. An eventually consistent miss is not terminal absence.",
              ],
              [
                "Reject an obsolete editor revision",
                "An atomic expected-revision check with the write; reading first on the client is insufficient.",
              ],
              [
                "Explain capability decisions",
                "Authorization on every operation, scoped snapshots and meaningful denial reasons.",
              ],
              [
                "Recover a session to the intended workspace",
                "Verified identity and receipt authorization. A different account cannot resume the old account's command.",
              ],
              [
                "Reconnect to a job",
                "Durable, authorized snapshots with ordered revisions and honest terminal/cancellation outcomes.",
              ],
              [
                "Present dates and amounts consistently",
                "Agreed instant and amount units; locale formatting does not perform currency conversion.",
              ],
            ],
          },
          {
            kind: "callout",
            title: "Review the current identity-endpoint policy",
            text: "The server session guard and recovery coordinator expire identity only on unauthenticated. A forbidden response is an authorization refusal; it cannot establish that the session is absent. Failed verification preserves its failure and offers recovery without silently signing the user out. Map your provider’s identity-endpoint responses explicitly.",
          },
        ],
      },
      {
        id: "integration",
        title: "Prove the adapter with real failure cases",
        blocks: [
          {
            kind: "list",
            items: [
              "Run the same operation contract against fixtures and the real adapter. Include malformed payloads, missing authorization and incorrect resource identity.",
              "Interrupt a response after the server commits; verify the original receipt can still settle the operation. Also test a request that never reached the server.",
              "Exercise revoked permissions, expired identity, stale revisions and job completion racing cancellation.",
              "Keep credentials server-side for the current cookie-based design. Add same-origin handlers deliberately for browser operations; changing a base URL does not create them.",
            ],
          },
          {
            kind: "sources",
            items: [
              {
                path: "src/lib/http/port.ts",
                why: "HttpClient, CallOptions and FailureDecoder contracts.",
              },
              {
                path: "src/lib/http/fetch-client.ts",
                why: "Fetch transport implementation.",
              },
              {
                path: "src/lib/http/envelope.ts",
                why: "The default failure-envelope mapping.",
              },
              {
                path: "src/lib/root/index.ts",
                why: "Adapter construction and per-domain selection.",
              },
              {
                path: "src/lib/app/session.ts",
                why: "The current cookie boundary.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "state-and-recovery",
    title: "State and recovery",
    description:
      "Choose state by ownership and lifetime, then preserve uncertainty honestly.",
    sections: [
      {
        id: "state-map",
        title: "Use the store that matches the lifetime",
        blocks: [
          {
            kind: "table",
            caption: "State ownership",
            headings: ["State", "Owner", "Key concern"],
            rows: [
              [
                "Shareable filters, selection and pagination",
                "src/lib/url-state and its Solid binding",
                "Typed query values, browser history and preservation of unowned parameters",
              ],
              [
                "Reusable server data",
                "src/lib/query",
                "Identity-aware cache keys, read retries and invalidation",
              ],
              [
                "An uncached request that can be superseded",
                "src/lib/runtime/latest-read",
                "Abort plus generation checks, even if the transport ignores abort",
              ],
              [
                "An editable draft and its unresolved command",
                "src/lib/runtime/save-draft",
                "Captured attempts, newer edits, checkpoints and receipt reconciliation",
              ],
              [
                "Browser documents",
                "src/lib/storage",
                "Schema decoding, versions, migration and explicit read/write failure",
              ],
              [
                "Stream notifications",
                "src/lib/realtime and query/live bindings",
                "Subscription lifecycle and authoritative catch-up reads",
              ],
              [
                "Display preferences and formatting",
                "Runtime preferences and src/lib/locale",
                "Explicit context, stable hydration and meaningful unavailable values",
              ],
            ],
          },
          {
            kind: "text",
            text: "The Solid URL binding updates client-owned view state through native history. It does not promise a server refetch. Use router navigation when server-rendered data must be fetched for the new address. Keep credentials and private drafts out of shareable URLs.",
          },
        ],
      },
      {
        id: "unknown-writes",
        title: "A missing response is not a failed write",
        blocks: [
          {
            kind: "list",
            items: [
              "Capture an operation ID and the submitted draft before sending a write. When durable recovery is required, persist that attempt first; a refused checkpoint blocks the send.",
              "Keep current input separate from the submitted input. A late receipt confirms the older draft without overwriting newer edits.",
              "If an outcome is uncertain, block a fresh save and look up the original operation. A failed lookup preserves uncertainty.",
              "Only a documented terminal absence permits another attempt. A missing record in an eventually consistent index cannot make that promise.",
              "On reload, restore an unresolved attempt as unknown. Signing in again restores access; it does not automatically replay the write.",
            ],
          },
          {
            kind: "text",
            text: "Local cancellation stops waiting. It cannot prove that a server write or background job stopped. Job cancellation therefore has a separate acknowledgment state, and only an authoritative job snapshot establishes a terminal outcome.",
          },
        ],
      },
      {
        id: "ownership-changes",
        title: "Previous data is useful only within the right scope",
        blocks: [
          {
            kind: "text",
            text: "A failed data refresh can retain the last accepted value within an account/resource scope. A permission refresh deliberately withdraws previous grants until it succeeds. On account or resource changes, dispose or replace the relevant stores and scope the cache; do not reuse someone else's data as a convenient loading state.",
          },
          {
            kind: "text",
            text: "Browser document versioning protects against accidental schema damage, not hostile access. The item/session recipes use per-account, per-recipe documents in sessionStorage; the default storage adapter uses localStorage. Surface storage refusal, and keep unknown future versions intact until an explicit reset. Browser persistence is not a security boundary or a server-side concurrency mechanism.",
          },
          {
            kind: "links",
            items: [
              {
                href: "/cookbook/session",
                label: "Session recovery",
                description:
                  "Expiry, account mismatch and a preserved operation.",
              },
              {
                href: "/cookbook/access",
                label: "Capabilities",
                description: "Stale grants and server-authoritative refusal.",
              },
              {
                href: "/cookbook/jobs",
                label: "Long-running jobs",
                description:
                  "Observation, reconnection and cancellation races.",
              },
              {
                href: "/cookbook/localization",
                label: "Localization",
                description: "Formatting context, long text and RTL.",
              },
            ],
          },
          {
            kind: "sources",
            items: [
              {
                path: "src/lib/runtime/save-draft.doc.ts",
                why: "Draft and receipt contract.",
              },
              {
                path: "src/lib/storage/doc.ts",
                why: "Persistence, versions and explicit failures.",
              },
              {
                path: "src/lib/services/jobs/doc.ts",
                why: "Progress, revision and cancellation semantics.",
              },
              {
                path: "notes/techniques/authority-and-observation-have-separate-lifetimes.md",
                why: "Why restoring access does not settle a previous command.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "verification",
    title: "Verification and specifications",
    description:
      "Separate agreement, behavioral evidence and independent specifications.",
    sections: [
      {
        id: "agreement",
        title: "Code and tests can agree on the wrong behavior",
        blocks: [
          {
            kind: "text",
            text: "When an agent writes both implementation and tests, a passing suite can show agreement without establishing that the behavior is right. A behavior specification supplies a separate statement of intent. Writing it first helps avoid deriving it from the implementation, but timing alone does not make the specification complete or correct.",
          },
          {
            kind: "list",
            items: [
              "Write and review the module's behavior contract and public shape before implementation.",
              "For a blind spec-test run, give the test writer only the approved specification and shape. Enforce its inability to inspect implementation, rather than relying only on a prompt.",
              "Have implementation satisfy that contract without rewriting the oracle to agree with its choices. Preserve the provenance of any changes.",
              "Introduce meaningful mutations and check whether the tests detect the altered behavior. Review surviving mutants and specification gaps.",
            ],
          },
          {
            kind: "callout",
            title: "The evidence in this template is labeled",
            text: "The recent resilience suites are ordinary implementation-visible tests with curated mutations. They are not claimed to be a blind writer run. A mutation score measures sensitivity to the selected defects; it does not establish an independent oracle, specification completeness or production correctness.",
          },
        ],
      },
      {
        id: "tools",
        title: "Use each check for the question it can answer",
        blocks: [
          {
            kind: "code",
            label: "Checks available in this repository",
            language: "sh",
            code: "npm run check:architecture -- --changed\nnpm run test:resilience\nnpm run test:resilience:mutations\nnpm test\nnpm run lint\nnpm run build",
          },
          {
            kind: "table",
            caption: "Evidence and limits",
            headings: ["Check", "Evidence", "Still needs judgment"],
            rows: [
              [
                "Architecture CLI",
                "Import ownership, declared tier rules and selected serialization boundaries",
                "DRY, composition quality, error recovery and the right product behavior",
              ],
              [
                "Behavior tests",
                "Specified scenarios produce the asserted outcomes",
                "Whether assertions cover the right contract and important cases",
              ],
              [
                "Curated mutations",
                "Tests detect selected deliberate behavior changes",
                "Unknown defects and oracle independence",
              ],
              [
                "Production build and bundle checks",
                "Compilation, route generation and selected bundle boundaries",
                "Authenticated dynamic interactions and backend correctness",
              ],
              [
                "Browser verification",
                "Rendered behavior, focus, history and responsive layout",
                "Untested browsers, assistive technology and real provider integration",
              ],
            ],
          },
          {
            kind: "text",
            text: "The mutation harness copies source into a temporary workspace, typechecks each change, and records structured test results. An equivalent mutation must survive; a compile error is invalid, never a killed mutant. Those controls check that the harness itself can distinguish outcomes.",
          },
        ],
      },
      {
        id: "review",
        title: "Ask for a contextual review",
        blocks: [
          {
            kind: "code",
            label: "A review request for a person or agent",
            language: "text",
            code: "Review these changes using tools/architecture/REVIEW.md.\nTrace each changed operation from its service Result\nthrough the framework boundary to the rendered recovery.\nCheck existing component and state-model contracts for reuse.\nSeparate mechanical evidence, findings and unverified assumptions.",
          },
          {
            kind: "text",
            text: "A clean architecture command can still report review_pending. That is deliberate: it does not claim that a duplicate-looking component is wrong or that a recovery action makes sense. Read the actual contracts and callers, then report the semantic judgment separately.",
          },
          {
            kind: "text",
            text: "The protocols are optional repository procedures. The application does not import them; this manual points to them as deeper reading. Keep the ones that help your team and preserve an honest account of which checks were performed.",
          },
          {
            kind: "links",
            items: [
              {
                href: "/cookbook/diagnostics",
                label: "Inspect an interaction trace",
                description:
                  "Follow request, decode and recovery stages without recording request bodies.",
              },
            ],
          },
          {
            kind: "sources",
            items: [
              {
                path: "protocols/spec-tests.md",
                why: "The blind spec-test procedure and its costs.",
              },
              {
                path: "protocols/spec-tests.role.md",
                why: "The test writer's enforced information boundary.",
              },
              {
                path: "tools/resilience/README.md",
                why: "Mutation scope, evidence files and provenance.",
              },
              {
                path: "tools/architecture/REVIEW.md",
                why: "The manual review lenses.",
              },
              {
                path: "protocols/notes.md",
                why: "Record what code cannot explain.",
              },
            ],
          },
        ],
      },
    ],
  },
];

export const manualHref = (slug: string) => `/cookbook/manual/${slug}`;
export const findChapter = (slug: string) =>
  chapters.find((chapter) => chapter.slug === slug);
