# Safety

Perch manages *metadata about* your projects in its own SQLite database. It only touches the actual project folders on disk in three specific, narrow ways — everything else is read-only inspection.

## The three things that write to your project folders

### 1. Generating documentation (`CLAUDE.md`, `README.md`-adjacent files, etc.)

- `POST /api/projects/:id/docs/generate` **never writes anything** — it only returns a preview: proposed content, the existing file's content if any, and whether they differ.
- `POST /api/projects/:id/docs/write` writes exactly one file, and **refuses with a 409** if the file already exists and the request doesn't explicitly pass `overwrite: true`.
- The UI (`DocumentationTab.tsx`) only ever calls `write` after showing the user the two-column diff and a warning banner when a file already exists.

### 2. Moving a project's folder

- `POST /api/organization/plan` is a pure dry run — it runs a checklist (source exists, is it a git repo, does the destination already exist, are there absolute-path references in config files, etc.) and returns `canProceed: false` if anything unsafe is found. It touches nothing.
- `POST /api/organization/move` **requires `confirm: true`** in the request body, re-runs the same checks server-side (never trusts a stale client-side plan), and then:
  1. copies the folder to the destination,
  2. counts files on both sides and aborts (deleting the incomplete copy, leaving the original untouched) if the counts don't match,
  3. only then deletes the original.
- If the destination path already exists, the move is refused outright — it will never overwrite an existing folder.
- The project's `local_path` in the database is only updated after a verified-successful move.

### 3. Re-scanning / importing a project

Scanning (`src/lib/scanner.ts`) only ever calls `fs.readdirSync`/`fs.readFileSync`/`fs.existsSync` and spawns read-only `git` subcommands (`status --porcelain`, `log`, `branch`, `remote get-url` — never `commit`, `push`, `reset`, or anything that mutates a repo). Nothing is written to the scanned folder.

## What Perch will never do

- Commit, push, reset, rebase, or otherwise mutate git history in any managed project.
- Read or display the *contents* of a `.env` file, or any secret/credential value — only variable *names* and whether they're set.
- Delete a project folder. Archiving a project (the "Archive" button) only changes its status/health in the database; nothing on disk is touched.
- Automatically move, rename, or reorganize a project without an explicit user click on "Confirm and move" after seeing the dry-run report.
- Scan a folder in the background without the user asking (no cron, no file watcher, no "scan on startup").
- Fake a result. Every button in the UI either performs its stated action or is disabled with a tooltip explaining why it's unavailable (see `ActionButtons.tsx` — Electron-only actions are feature-detected, not silently no-op'd).

## Its own database

Perch's own data (projects, tasks, bugs, etc.) lives in one SQLite file. Deleting it (`npm run db:reset`) only resets Perch's own tracking — it never touches any of the actual project folders it's tracking.
