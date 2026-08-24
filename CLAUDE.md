# Perch — Notes for Claude

## What this project is

A local-first developer project management dashboard ("Perch"). It tracks other software projects (name, tech stack, git status, tasks, bugs, docs) in a single SQLite database, and can scan real folders on disk to auto-detect facts about them. It is itself meant to eventually be sellable as a standalone product — so avoid hardcoding anything specific to the current user's machine or projects into the application code itself (that data belongs in the database, seeded via `scripts/seed.ts`, never in `src/`).

## Architecture in one line

Next.js App Router (UI + API routes, all in one process) wrapped by an Electron shell, backed by a single `better-sqlite3` SQLite file. See `ARCHITECTURE.md` for the full picture.

## Development rules

- All database access goes through `src/lib/queries.ts`. Don't run raw SQL from route handlers except for read-only joins that don't have a query helper yet — and if you add one, put it in `queries.ts`, not inline.
- All filesystem/git inspection is read-only and lives in `src/lib/scanner.ts` and `src/lib/git.ts`. Anything that writes to disk (`src/lib/organization.ts`'s `performMove`, the docs `/write` route) must go through an explicit dry-run-then-confirm flow — never make a new endpoint that mutates the filesystem without that pattern.
- Environment variable *values* must never be read, logged, or returned from any API route — only variable *names* and a configured/missing/unknown status. This is enforced by convention, not a lint rule, so watch for it in review.
- `src/lib/db.ts` reads `process.env.DB_DIR`, set by `electron/main.cjs` to `app.getPath('userData')/data` when packaged. Don't assume `process.cwd()`-relative paths for anything user-data-related.

## Known limitations

- Kanban/task status changes are dropdown-based, not drag-and-drop.
- `ProjectActionButtons` "Run Project" and "Open Terminal" are implemented for macOS and Windows only; Linux terminal launching is best-effort (tries a few common emulators) and untested.
- No automated test suite yet — verification so far has been manual: build, seed, dev server, and full Electron packaging (mac dmg x2 archs + Windows NSIS installer + portable exe, all built and the mac ones actually launched and confirmed to load real data) all passed. The Windows `.exe`s were built (cross-compiled from macOS via Wine, see `SETUP.md`) but never actually run — no Windows machine was available to test on.
- The documentation generator (`src/lib/docGenerator.ts`) produces useful but fairly mechanical docs from recorded fields — it's a starting draft, not a substitute for a human (or Claude) writing real prose once a project's specifics are known.
- The app icon (`build/icon-source.svg`, rasterized by `scripts/generate-icons.mjs`) is a first pass, not vetted by a designer — regenerate freely if the brand direction changes.

## Before modifying

- **The better-sqlite3 / Electron ABI mismatch is real and easy to reintroduce.** better-sqlite3 is a native module; it must be compiled for the system Node ABI to run under `next dev`/`next build`, but for a different ABI to run inside Electron. `npm run build:app` handles this automatically (`rebuild:node` → `next build` → `rebuild:electron` → `scripts/prepare-server.mjs` copies the Electron-rebuilt binary over Next's traced copy → `rebuild:node` again to leave the repo usable for `next dev`). If you change that script's order, the packaged app will fail at startup with an `ERR_DLOPEN_FAILED` / `NODE_MODULE_VERSION` mismatch — this has already happened once during development and was fixed by explicitly re-copying the native binary in `scripts/prepare-server.mjs` after the Electron rebuild, since `next build`'s own output-file-tracing only snapshots node_modules once, at build time.
- Check `db/schema.sql` before adding a new field — this is the single source of truth for the schema, applied idempotently (`CREATE TABLE IF NOT EXISTS`) on every app start via `src/lib/db.ts`. There are no migration files; schema changes need `ALTER TABLE` statements added there, guarded so they don't fail on repeat runs.
- Running `npx electron-builder --mac`/`--win` directly (bypassing `npm run package:*`) leaves the ROOT `node_modules/better-sqlite3` compiled for Electron's ABI afterward (electron-builder does its own internal rebuild step). Run `npm run rebuild:node` afterward or `next dev`/`npm run db:seed` will fail with the same `ERR_DLOPEN_FAILED` error described above.

## Important decisions

- SQLite (via `better-sqlite3`) over any client/server database, per an explicit requirement that this run fully offline as a single local file.
- Electron desktop packaging (not a plain local web app) was chosen specifically so this can be sold as a standalone downloadable product later, and so it has real filesystem/git/terminal access without a separate backend service.
- The project deliberately does not call any external AI API for "Explain This Project" — it's a deterministic readout of recorded data, not a model call, so it never invents information that isn't actually on file.
