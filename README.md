# flover-solid

An opinionated SolidStart frontend template with composable UI, explicit Result/Failure boundaries, replaceable backend adapters, and recovery examples you can exercise.

The root is a blue gradient landing page. `/kitchen-sink` documents 22 component groups, `/cookbook` contains working recipes and a seven-chapter manual, and `/app` is a fresh product canvas behind the demo sign-in.

## Run locally

Use the Node version in `.nvmrc` and pnpm:

```sh
pnpm install
pnpm dev
```

For the production server:

```sh
pnpm build
pnpm start
```

Set `PORT` and `HOST` when needed. The production output is a Nitro Node server. Demo credentials are `ada@example.com` / `password`.

## Architecture

- `src/components`: tokens, primitives and composable patterns; behavior comes from props.
- `src/lib/kernel`, `http`, `services`, `root`: portable values, transport ports, validated operations and adapter selection.
- `src/lib/runtime`, `query`, `app`, `server`: Solid ownership, cache policy, browser state and SolidStart boundaries.
- `src/routes`: routing; `src/examples`: cookbook and catalog compositions.

Services accept an HTTP port and return `Result`; framework edges return plain data. Configure `API_BASE_URL` and `API_SERVED_DOMAINS` for a backend, and map its response envelopes in an adapter. The template does not require a particular backend language or platform. The cookbook includes fixtures and controlled simulations; production authorization, durable receipts and job execution require backend support.

## Verify

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm check:architecture --all
pnpm test:resilience
pnpm test:resilience:mutations
pnpm test:browser --base http://127.0.0.1:3000
```

Architecture checks report enforceable violations separately from contextual review. Imported and port-authored regressions are implementation-visible, not a new blind spec oracle. Mutation checks use isolated copies, an equivalent control and an invalid-code control. See [port evidence](docs/port-parity.md), [the manual](docs/manual/README.md), and [verification protocols](protocols/README.md).

The siblings are independent projects. This directory has no runtime imports from Next or Svelte.
