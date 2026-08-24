# Architecture

```
Electron main process (electron/main.cjs)
  │  spawns, as a plain Node process (ELECTRON_RUN_AS_NODE=1)
  ▼
Next.js standalone server (.next/standalone/server.js)
  │  App Router — pages AND API routes in one process
  ├─ src/app/**/page.tsx        (server components, read straight from SQLite)
  ├─ src/app/api/**/route.ts    (mutations, scanning, git, docs, org moves)
  └─ src/lib/
       ├─ db.ts            single better-sqlite3 connection, schema applied on boot
       ├─ queries.ts        all SQL lives here
       ├─ scanner.ts        read-only folder → ScanReport (framework/lang/git/env/docs)
       ├─ git.ts            read-only git status/log via `git` CLI spawned per call
       ├─ docGenerator.ts   builds CLAUDE.md / ARCHITECTURE.md / etc. from DB state
       ├─ explainer.ts      deterministic "Explain This Project" — no AI call
       └─ organization.ts   dry-run + confirmed folder-move planner
  ▼
SQLite file (db path: $DB_DIR/perch.db, WAL mode)
```

A `BrowserWindow` in the Electron main process loads `http://127.0.0.1:<port>` — the UI is genuinely served by the Next server, not loaded from static files, so the same codebase also runs as an ordinary web app via `npm run dev` for day-to-day development.

## Why one process, not a separate backend

The brief for this app explicitly asked for "frontend + local API/backend + SQLite" without extra services. Next.js Route Handlers already give us a real Node backend colocated with the UI, so there's no separate Express/Fastify server — API routes under `src/app/api/**` run with full Node.js APIs (`node:fs`, `node:child_process`, `better-sqlite3`), same as any backend would.

## Where OS-level actions come from

Three things a web page cannot do on its own — opening Finder at a path, opening a Terminal window, opening an external URL from inside a sandboxed window — are exposed via a `contextBridge` in `electron/preload.cjs` as `window.perch.*`. Components feature-detect this (`ActionButtons.tsx`) and disable those buttons entirely when not running inside Electron, rather than pretending they work.

## Database

Single SQLite file, schema in `db/schema.sql`, applied idempotently on every boot (`CREATE TABLE IF NOT EXISTS`). No ORM — plain parameterized SQL via `better-sqlite3`, wrapped in typed helper functions in `src/lib/queries.ts`. See `PROJECT_STRUCTURE.md` for the full table list.

## Scanning vs. stored state

A project's technologies, env vars, and doc-completeness score are **stored** in the database (editable, sortable, don't require the folder to exist to view). They're refreshed by an explicit "Re-scan" action per project (`POST /api/projects/:id/scan`) or during import (`POST /api/scan`) — Perch never scans a folder automatically in the background.

## Desktop packaging note

better-sqlite3 is a native module and needs to be compiled against Electron's own Node ABI to run inside the packaged app, which differs from the system Node ABI used by `next dev`/`next build`. `npm run build:app` handles the rebuild-and-swap automatically — see `CLAUDE.md`'s "Before modifying" section if you're touching that pipeline.
