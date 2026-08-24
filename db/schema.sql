-- Command Deck local database schema (SQLite)
-- All CREATE statements are idempotent so this file can be re-applied on every app start.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  slug                  TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  description           TEXT,
  purpose               TEXT,
  type                  TEXT NOT NULL DEFAULT 'other'
                          CHECK (type IN ('web_app','website','saas','automation','ai_tool','mobile_app','desktop_app','api','experiment','internal_tool','other')),
  status                TEXT NOT NULL DEFAULT 'idea'
                          CHECK (status IN ('idea','prototype','development','active','production','paused','completed','archived')),
  priority              TEXT NOT NULL DEFAULT 'medium'
                          CHECK (priority IN ('low','medium','high','critical')),
  health                TEXT NOT NULL DEFAULT 'unknown'
                          CHECK (health IN ('healthy','needs_attention','broken','archived','unknown')),
  health_is_manual      INTEGER NOT NULL DEFAULT 0,
  owner                 TEXT,
  version               TEXT,
  local_path            TEXT UNIQUE,
  git_remote_url        TEXT,
  production_url        TEXT,
  staging_url           TEXT,
  completion_percentage INTEGER,
  notes                 TEXT,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_scanned_at       TEXT
);

CREATE TABLE IF NOT EXISTS tags (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS project_tags (
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id      INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

-- Technologies covers frameworks/languages/runtimes/package managers/db/css/auth/hosting AND
-- external services/APIs (category='service' or 'integration') so the same table powers both
-- the Technology section and the architecture / System Map integrations.
CREATE TABLE IF NOT EXISTS technologies (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  category  TEXT NOT NULL DEFAULT 'other'
              CHECK (category IN ('framework','language','runtime','package_manager','database','css','auth','hosting','api','service','integration','other')),
  UNIQUE (name, category)
);

CREATE TABLE IF NOT EXISTS project_technologies (
  project_id     INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  technology_id  INTEGER NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
  detail         TEXT, -- e.g. version string, or short note ("send-only", "read-only")
  PRIMARY KEY (project_id, technology_id)
);

-- Environment variables: names only, never values.
CREATE TABLE IF NOT EXISTS env_vars (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('configured','missing','unknown')),
  is_public   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (project_id, name)
);

-- Important files registry, powers the File Structure View.
CREATE TABLE IF NOT EXISTS important_files (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id            INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path                  TEXT NOT NULL,
  purpose               TEXT,
  importance            TEXT NOT NULL DEFAULT 'medium' CHECK (importance IN ('critical','high','medium','low')),
  safe_to_modify        INTEGER NOT NULL DEFAULT 1,
  related_functionality TEXT,
  UNIQUE (project_id, path)
);

CREATE TABLE IF NOT EXISTS tasks (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id        INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  status            TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog','todo','in_progress','blocked','review','done')),
  priority          TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  due_date          TEXT,
  labels            TEXT, -- JSON array of strings
  estimated_effort  TEXT,
  notes             TEXT,
  position          INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS task_dependencies (
  task_id            INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on_task_id)
);

CREATE TABLE IF NOT EXISTS bugs (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id        INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  severity          TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical','high','medium','low')),
  description       TEXT,
  repro_steps       TEXT,
  status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','fixed','wont_fix','duplicate')),
  related_files     TEXT, -- JSON array of strings
  workaround        TEXT,
  date_discovered   TEXT,
  date_fixed        TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS changelog_entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version     TEXT,
  entry_date  TEXT,
  summary     TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','git')),
  commit_sha  TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Claude Knowledge / documentation state per project.
CREATE TABLE IF NOT EXISTS claude_knowledge (
  project_id            INTEGER PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  has_claude_md         INTEGER NOT NULL DEFAULT 0,
  has_readme            INTEGER NOT NULL DEFAULT 0,
  architecture_notes    TEXT,
  dev_rules             TEXT,
  known_limitations     TEXT,
  important_decisions   TEXT,
  do_not_change         TEXT,
  check_before_modifying TEXT,
  documentation_score   INTEGER, -- 0-100, rough completeness estimate
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Record of generated/updated docs so we never silently overwrite.
CREATE TABLE IF NOT EXISTS doc_generations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  doc_name      TEXT NOT NULL, -- e.g. PROJECT_OVERVIEW.md
  action        TEXT NOT NULL CHECK (action IN ('created','updated','skipped_existing')),
  written_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Raw scan reports (one per scan run) for history / audit.
CREATE TABLE IF NOT EXISTS scans (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id          INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scanned_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  report_json         TEXT NOT NULL,
  computed_health     TEXT,
  recommended_actions TEXT -- JSON array of strings
);

-- Project <-> project relationships, and project -> external technology/integration
-- relationships that are specifically meant for the System Map (a superset of
-- project_technologies, since not every technology is diagram-worthy).
CREATE TABLE IF NOT EXISTS project_relationships (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  from_project_id     INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  to_project_id       INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  to_technology_id    INTEGER REFERENCES technologies(id) ON DELETE CASCADE,
  relationship_type   TEXT NOT NULL DEFAULT 'depends_on',
  description         TEXT,
  CHECK ((to_project_id IS NOT NULL) <> (to_technology_id IS NOT NULL))
);

-- Free-form key/value app settings (scan roots, theme, org root, etc).
CREATE TABLE IF NOT EXISTS settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_bugs_project ON bugs(project_id);
CREATE INDEX IF NOT EXISTS idx_changelog_project ON changelog_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_envvars_project ON env_vars(project_id);
CREATE INDEX IF NOT EXISTS idx_files_project ON important_files(project_id);
CREATE INDEX IF NOT EXISTS idx_scans_project ON scans(project_id);
CREATE INDEX IF NOT EXISTS idx_rel_from ON project_relationships(from_project_id);
