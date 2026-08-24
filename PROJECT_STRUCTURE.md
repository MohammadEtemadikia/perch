# Project Structure

```
db/
  schema.sql              single source of truth for the schema (idempotent CREATE statements)

electron/
  main.cjs                 desktop shell: spawns the Next server, owns the BrowserWindow,
                            exposes openPath/openExternal/openTerminal/runCommand over IPC
  preload.cjs               contextBridge — exposes window.perch to the renderer

scripts/
  seed.ts                   seeds the DB with real, factual project data (edit or replace freely)
  reset-db.mjs               deletes the local SQLite file
  prepare-server.mjs         post-`next build` step: copies static assets, db/schema.sql, and
                              (critically) the Electron-rebuilt better-sqlite3 binary into
                              .next/standalone
  after-pack.cjs              electron-builder hook: copies .next/standalone into the packaged app
                              (extraResources can't be used here — it strips node_modules)

src/lib/
  db.ts                      opens the SQLite connection, applies db/schema.sql on boot
  types.ts                    shared TypeScript types mirroring the schema
  queries.ts                  all SQL — projects, tasks, bugs, changelog, tags, technologies,
                              env vars, files, claude_knowledge, scans, relationships, settings,
                              global search
  scanner.ts                  read-only folder scanner (framework/language/db/deploy/env/git/docs)
  git.ts                      read-only git status/log via the `git` CLI
  docGenerator.ts             builds the 7 generatable docs from stored project data
  explainer.ts                deterministic "Explain This Project" (no AI call)
  organization.ts             dry-run + confirmed project folder mover

src/app/
  layout.tsx, globals.css     shell: sidebar + command palette + toasts, theme tokens
  dashboard/                  home overview (stats, health breakdown, needs-attention list)
  projects/                   list (search/filter/sort/grid/list) + [slug] detail (10 tabs)
  tasks/, bugs/                cross-project views
  documentation/                doc-completeness table across all projects
  technologies/, integrations/  tech/service inventory grouped by category
  git/                          read-only git status across all projects
  organization/                  safe folder-move planner UI
  system-map/                    visual ecosystem overview
  settings/                       scan roots, organization root, DB path
  api/**/route.ts                every mutation and scan/git/docs/organization endpoint

src/components/
  Sidebar, CommandPalette, Toast, Modal/ConfirmDialog     — shell chrome
  ProjectCard, ProjectsBoard, badges                       — project list
  ProjectDetailClient + OverviewTab/ArchitectureTab/FilesTab/
    ClaudeKnowledgeTab/DocumentationTab/TasksTab/BugsTab/
    ChangelogTab/EnvironmentTab/GitTab                      — the 10 project-detail tabs
  NewProjectModal, ImportProjectModal, EditProjectModal      — create/import/edit flows
  ActionButtons                                             — Electron-only OS integration buttons
  OrganizationPlanner, SettingsForm, GlobalTasksBoard,
    GlobalBugsBoard                                          — remaining top-level pages
```

## Where a new feature probably belongs

- A new fact about a project → add a column to `db/schema.sql`, a field in `src/lib/types.ts`, and read/write it in `src/lib/queries.ts`.
- A new thing to detect from a folder → `src/lib/scanner.ts`.
- A new page → `src/app/<name>/page.tsx`, add it to `NAV` in `src/components/Sidebar.tsx` and to `STATIC_COMMANDS` in `src/components/CommandPalette.tsx`.
- A new destructive action → follow the pattern in `src/lib/organization.ts` (plan → checks → explicit `confirm: true` → perform → verify) or `docs/generate` + `docs/write` (preview → explicit `overwrite` flag → write).
