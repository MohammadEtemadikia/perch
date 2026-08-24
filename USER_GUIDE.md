# Perch — User Guide

Perch is a local-first **project command center**: a single desktop app that tracks every software project you own — what it is, how healthy it is, what's broken, what's left to do — backed by one local SQLite file. It runs entirely on your machine. Nothing is ever sent to the network except the optional "open repository in browser" / "open external link" actions you trigger yourself.

This guide covers every feature end to end, plus how to install and run the app. For architecture/internals see `ARCHITECTURE.md`; for the native-module packaging details see `SETUP.md`.

---

## 1. First launch

The very first time Perch opens, it shows a one-time setup screen with three choices:

- **Set a password** — Perch will ask for it every time the app is opened (the session then stays unlocked for 30 days, or until you sign out / restart).
- **Skip — don't use a password** — Perch opens immediately, with no login screen at all. This is the default most people want on a personal machine.
- You can change your mind at any time from **Settings → Security** — set a password later, change it, or remove it again. None of this touches your project data; it only gates the app itself.

## 2. Dashboard

The home screen. At a glance:

- **Stat tiles** — Total projects, Active, Development, Paused, Archived, Production, With issues (open bugs), Needs docs (documentation score under 50%).
- **Needs attention** — every project whose health is "Broken" or "Needs attention", with its open bug/task counts.
- **Project health** — a breakdown of every project by health status (Healthy / Needs attention / Broken / Archived / Unknown).
- **Recently updated** — the 6 most recently touched projects.

Health is either computed automatically from the last scan, or set manually from a project's Edit form ("manual override").

## 3. Projects

### The list (`/projects`)

- Full-text search across name, description, technologies, and tags.
- Filter by status, type, and tag (dropdowns only show tags/filters that actually exist).
- Sort by last updated, name, or health.
- Grid view (cards) or table view.
- **New project** — add one by hand.
- **Import** — point at a real folder on disk; Perch scans it (see §9) and pre-fills everything it can detect.

### A project's page (`/projects/[slug]`)

Header actions:
- **Re-scan** — re-run the folder scan (disabled if no local path is set).
- **Edit** — change any recorded field, including picking the local folder via a native folder picker when running inside the desktop app.
- **Archive** — sets status/health to "Archived". Non-destructive, reversible from Edit.
- **Delete** — permanently removes the project record (and all its tasks, bugs, changelog entries, files, env vars, and Claude knowledge) from the database. Nothing on disk is touched — this only affects Perch's own record. Requires confirmation and cannot be undone.
- **Open Folder / Open Terminal / Open Git Repository / Run Project** — desktop-app-only OS integration buttons (see §10).

Ten tabs:

1. **Overview** — description, purpose, priority, completion %, URLs, tags.
2. **Architecture** — technologies/services grouped by category (framework, language, database, hosting, etc).
3. **Files** — the "important files" registry: path, purpose, importance, whether it's safe to modify.
4. **Claude Knowledge** — architecture notes, dev rules, known limitations, important decisions, "do not change" / "check before modifying" notes — the same kind of context a `CLAUDE.md` file would carry.
5. **Documentation** — a completeness score plus **doc generation**: Perch can draft `CLAUDE.md`, `PROJECT_OVERVIEW.md`, `ARCHITECTURE.md`, `SETUP.md`, `API.md`, `DATABASE.md`, and `CHANGELOG.md` from what's actually recorded about the project. Generation always shows a diffable preview first; nothing is written to disk without an explicit confirm, and an existing file is never silently overwritten.
6. **Tasks** — kanban (Backlog/Todo/In Progress/Blocked/Review/Done) or list view, with comma-separated labels you can filter by.
7. **Bugs** — severity, status, repro steps, workaround, discovered/fixed dates.
8. **Changelog** — manual entries, or imported straight from git history.
9. **Environment** — env var *names* and whether each is configured/missing (values are never read, stored, or shown — see §11).
10. **Git** — read-only branch, last commit, uncommitted file count, remote URL, and recent commit log. Perch never commits, pushes, resets, or otherwise touches git history.

## 4. Tasks & Bugs (cross-project)

`/tasks` and `/bugs` show every task/bug across every project in one table, filterable by status (and, for tasks, by label), with a link back to the owning project.

## 5. Documentation health

`/documentation` lists every project's documentation completeness score in one place, so you can spot which ones need a `CLAUDE.md` or `README` most.

## 6. Technologies & Integrations

`/technologies` and `/integrations` are inventories of every technology/service recorded across all projects, grouped by category — useful for "which of my projects use Postgres" or "what am I depending on Stripe for."

## 7. System Map

`/system-map` is a visual overview of how your projects relate to each other and to external services/integrations.

## 8. Project Organization

`/organization` plans folder moves following a `00_HQ / 01_ACTIVE / 02_PROTOTYPES / …` structure. It is always a dry run first: you see the plan and any warnings, and nothing moves on disk until you explicitly confirm.

## 9. Scanning & "Explain This Project"

Scanning a folder (on import, or via "Re-scan") reads real files on disk — `package.json`, lockfiles, `.env*` (names only), git metadata — to detect framework, language, package manager, database, hosting/deploy config, and a documentation score. It is entirely read-only and never runs automatically in the background. Anything it can't determine is shown as "unknown" rather than guessed.

"Explain This Project" is a deterministic readout built purely from what's actually recorded in the database — it never calls any AI model, so it never invents information that isn't on file.

## 10. Desktop-only OS integration

Inside the packaged desktop app (not in a plain browser), a project page can:
- Open its folder in Finder/Explorer.
- Open a terminal at that folder.
- Open its git remote in your browser.
- Run its detected dev/start script in a terminal.

These buttons are disabled (not hidden with fake functionality) when running in a plain browser tab.

## 11. Privacy & safety

- Everything lives in one local SQLite file. Nothing is uploaded anywhere.
- Environment variable **values** are never read, logged, stored, or displayed — only variable names and a configured/missing/unknown status.
- Git access is read-only.
- Any action that touches your filesystem (folder moves, doc file writes) is a dry-run-then-confirm flow — never silent.
- See `SAFETY.md` for the complete list.

## 12. Settings

`/settings`:

- **Scan roots** — folders Perch suggests when importing (a shortcut list only; never scanned automatically).
- **Organization root** — the base folder the Project Organization planner suggests destinations under.
- **Language** — switch the whole interface between English and Persian (فارسی). Persian automatically switches the layout to right-to-left. This is remembered and applies immediately, everywhere.
- **Database** — shows the local SQLite file path.
- **Security** — set, change, or remove your password. Turning it off means anyone with access to this machine can open Perch with no prompt.
- **Credits** — built by Mohammad Etemadikia (etemadikia@technologist.com).

## 13. Command Palette

Press **⌘K** / **Ctrl+K** anywhere to search projects/tasks/bugs/technologies, or jump straight to any page or action ("Create Project", "Import Existing Project", etc).

## 14. Light/dark mode

Toggle from the bottom of the sidebar; the choice is remembered per device.

---

## Installing & running

### Requirements

- Node.js 20+
- `git` on your PATH (used read-only)
- macOS, Windows, or Linux

### A. Running the pre-built installer (easiest)

If you already have a built installer:

- **macOS**: open the `.dmg`, drag `Perch.app` into Applications, then open it. If macOS says it can't verify the developer (the build is unsigned), right-click the app → **Open** once.
- **Windows**: run `Perch Setup <version>.exe` (installer) or `Perch-portable-<version>.exe` (no install needed) from the `dist/` folder.

All your data lives in a single local file the app manages itself — nothing else to configure.

### B. Running from source (development)

```bash
npm install
npm run db:seed     # optional — seeds sample data from scripts/seed.ts
npm run dev          # opens at http://localhost:4100
```

### C. Running as the actual desktop app from source

```bash
npm run app
```

### D. Building your own installer

```bash
npm run package:mac     # .dmg (Apple Silicon + Intel)
npm run package:win     # NSIS installer + portable .exe
npm run package:linux   # AppImage
```

Each `package:*` script automatically clears out `dist/` first, so old installers never pile up — every run leaves you with exactly the current build. See `SETUP.md` for the native-module rebuild details behind this (only relevant if you're modifying the build pipeline itself).

### Resetting everything

```bash
npm run db:reset     # deletes the local SQLite file
npm run db:seed       # repopulates from scripts/seed.ts
```

If you ever forget your Perch password and can't get in: reset the database as above, or (packaged app) delete the app's data folder — this also clears every project you tracked, so only do this as a last resort.
