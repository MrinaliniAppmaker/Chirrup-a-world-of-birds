# CHIRRUP

A mobile bird-creation studio: combine traits, generate an imagined bird portrait and field notes, and keep a private on-device journal.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/chirrup run dev` — managed Expo mobile preview
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

- Collections stay on the user's device, without accounts or a server-side database. Native portraits are separate document files to avoid AsyncStorage row limits.
- Generated birds are fictional; portraits and field notes must be labeled as imagined, not real species identification.
- Figma's field-studio visual identity is adapted for phone screens, not copied as a desktop layout.

## Product

Choose bird traits visually or type them, review choices, generate a real AI portrait with appearance, habitat, diet and behavior, and save/search/remove creations in a local journal.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
