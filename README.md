# Library Monorepo

A monorepo for a library management system built with Bun workspaces and Turborepo.

## Workspace Layout

- `apps/client`: Vite + React client for the library dashboard, borrowing, renewal, and admin flows
- `apps/server`: Hono API server with Better Auth integration
- `packages/db`: Drizzle ORM database package, schema definitions, and seed scripts

## Getting Started

```sh
bun install
```

Create the required environment files before running the app:

- `apps/server/.env`
- `packages/db/.env`
- `.env.deploy` for Alibaba Cloud FC deployment (copy from `.env.deploy.example`)

## Common Commands

Run workspace-wide tasks from the repository root:

```sh
bun run build
bun run lint
bun run check-types
```

Run the main apps individually during development:

```sh
bun run --cwd apps/client dev
bun run --cwd apps/server dev
```

Useful database commands:

```sh
bun run --cwd packages/db db:push
bun run --cwd packages/db db:reset
bun run --cwd packages/db dev
```

Deploy to Alibaba Cloud FC:

```sh
cp .env.deploy.example .env.deploy
```

Fill `.env.deploy` with your cloud values, then run:

```sh
bun run deploy
```

The deploy script loads `.env.deploy`, validates that cloud URLs are not pointing to `localhost`, and then runs `s deploy -t s.yaml --use-local -y`.

## Notes

- Build outputs are written to each package's `dist` directory.
- TypeScript incremental cache files such as `*.tsbuildinfo` are treated as local artifacts and should not be committed.
