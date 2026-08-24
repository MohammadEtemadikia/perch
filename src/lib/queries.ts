import { db } from "./db";
import type {
  Bug,
  ChangelogEntry,
  ClaudeKnowledge,
  EnvVar,
  ImportantFile,
  Project,
  ProjectRelationship,
  ProjectWithCounts,
  ScanRecord,
  Task,
  TechCategory,
} from "./types";

const now = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function listProjects(): ProjectWithCounts[] {
  const rows = db
    .prepare(
      `SELECT p.*,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status != 'done') AS open_tasks,
        (SELECT COUNT(*) FROM bugs b WHERE b.project_id = p.id AND b.status NOT IN ('fixed','wont_fix','duplicate')) AS open_bugs
       FROM projects p
       ORDER BY p.name COLLATE NOCASE ASC`
    )
    .all() as (Project & { open_tasks: number; open_bugs: number })[];

  const tagStmt = db.prepare(
    `SELECT tg.name FROM project_tags pt JOIN tags tg ON tg.id = pt.tag_id WHERE pt.project_id = ?`
  );
  const techStmt = db.prepare(
    `SELECT te.name, te.category FROM project_technologies pt JOIN technologies te ON te.id = pt.technology_id WHERE pt.project_id = ?`
  );

  return rows.map((row) => ({
    ...row,
    tags: (tagStmt.all(row.id) as { name: string }[]).map((t) => t.name),
    technologies: techStmt.all(row.id) as { name: string; category: TechCategory }[],
  }));
}

export function getProjectBySlug(slug: string): Project | undefined {
  return db.prepare(`SELECT * FROM projects WHERE slug = ?`).get(slug) as Project | undefined;
}

export function getProjectById(id: number): Project | undefined {
  return db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as Project | undefined;
}

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `project-${Date.now()}`;
}

export function createProject(input: Partial<Project> & { name: string }): Project {
  let slug = input.slug || slugify(input.name);
  const existing = getProjectBySlug(slug);
  if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const stmt = db.prepare(
    `INSERT INTO projects (slug, name, description, purpose, type, status, priority, health, owner, version, local_path, git_remote_url, production_url, staging_url, completion_percentage, notes)
     VALUES (@slug, @name, @description, @purpose, @type, @status, @priority, @health, @owner, @version, @local_path, @git_remote_url, @production_url, @staging_url, @completion_percentage, @notes)`
  );
  const info = stmt.run({
    slug,
    name: input.name,
    description: input.description ?? null,
    purpose: input.purpose ?? null,
    type: input.type ?? "other",
    status: input.status ?? "idea",
    priority: input.priority ?? "medium",
    health: input.health ?? "unknown",
    owner: input.owner ?? null,
    version: input.version ?? null,
    local_path: input.local_path ?? null,
    git_remote_url: input.git_remote_url ?? null,
    production_url: input.production_url ?? null,
    staging_url: input.staging_url ?? null,
    completion_percentage: input.completion_percentage ?? null,
    notes: input.notes ?? null,
  });
  return getProjectById(info.lastInsertRowid as number)!;
}

const PROJECT_EDITABLE_FIELDS = [
  "name",
  "description",
  "purpose",
  "type",
  "status",
  "priority",
  "health",
  "health_is_manual",
  "owner",
  "version",
  "local_path",
  "git_remote_url",
  "production_url",
  "staging_url",
  "completion_percentage",
  "notes",
] as const;

export function updateProject(id: number, patch: Partial<Project>): Project | undefined {
  const fields = PROJECT_EDITABLE_FIELDS.filter((f) => f in patch);
  if (fields.length === 0) return getProjectById(id);
  const setClause = fields.map((f) => `${f} = @${f}`).join(", ");
  const params: Record<string, unknown> = { id };
  for (const f of fields) params[f] = (patch as Record<string, unknown>)[f] ?? null;
  db.prepare(`UPDATE projects SET ${setClause}, updated_at = @updated_at WHERE id = @id`).run({
    ...params,
    updated_at: now(),
  });
  return getProjectById(id);
}

export function deleteProject(id: number): void {
  db.prepare(`DELETE FROM projects WHERE id = ?`).run(id);
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export function setProjectTags(projectId: number, tagNames: string[]): void {
  const insertTag = db.prepare(`INSERT OR IGNORE INTO tags (name) VALUES (?)`);
  const getTagId = db.prepare(`SELECT id FROM tags WHERE name = ?`);
  const clear = db.prepare(`DELETE FROM project_tags WHERE project_id = ?`);
  const link = db.prepare(`INSERT OR IGNORE INTO project_tags (project_id, tag_id) VALUES (?, ?)`);

  const tx = db.transaction((names: string[]) => {
    clear.run(projectId);
    for (const raw of names) {
      const name = raw.trim();
      if (!name) continue;
      insertTag.run(name);
      const row = getTagId.get(name) as { id: number };
      link.run(projectId, row.id);
    }
  });
  tx(tagNames);
}

export function listAllTags(): { name: string; count: number }[] {
  return db
    .prepare(
      `SELECT tg.name AS name, COUNT(pt.project_id) AS count
       FROM tags tg LEFT JOIN project_tags pt ON pt.tag_id = tg.id
       GROUP BY tg.id ORDER BY count DESC, tg.name ASC`
    )
    .all() as { name: string; count: number }[];
}

// ---------------------------------------------------------------------------
// Technologies
// ---------------------------------------------------------------------------

export function setProjectTechnologies(
  projectId: number,
  techs: { name: string; category: TechCategory; detail?: string }[]
): void {
  const insertTech = db.prepare(
    `INSERT OR IGNORE INTO technologies (name, category) VALUES (@name, @category)`
  );
  const getTechId = db.prepare(`SELECT id FROM technologies WHERE name = ? AND category = ?`);
  const clear = db.prepare(`DELETE FROM project_technologies WHERE project_id = ?`);
  const link = db.prepare(
    `INSERT OR IGNORE INTO project_technologies (project_id, technology_id, detail) VALUES (?, ?, ?)`
  );

  const tx = db.transaction((items: typeof techs) => {
    clear.run(projectId);
    for (const t of items) {
      insertTech.run(t);
      const row = getTechId.get(t.name, t.category) as { id: number };
      link.run(projectId, row.id, t.detail ?? null);
    }
  });
  tx(techs);
}

export function listAllTechnologies(): { name: string; category: TechCategory; project_count: number }[] {
  return db
    .prepare(
      `SELECT te.name AS name, te.category AS category, COUNT(pt.project_id) AS project_count
       FROM technologies te LEFT JOIN project_technologies pt ON pt.technology_id = te.id
       GROUP BY te.id ORDER BY project_count DESC, te.name ASC`
    )
    .all() as { name: string; category: TechCategory; project_count: number }[];
}

export function projectsUsingTechnology(name: string): Project[] {
  return db
    .prepare(
      `SELECT p.* FROM projects p
       JOIN project_technologies pt ON pt.project_id = p.id
       JOIN technologies te ON te.id = pt.technology_id
       WHERE te.name = ? COLLATE NOCASE`
    )
    .all(name) as Project[];
}

// ---------------------------------------------------------------------------
// Env vars
// ---------------------------------------------------------------------------

export function setProjectEnvVars(
  projectId: number,
  vars: { name: string; status: EnvVar["status"]; is_public?: boolean }[]
): void {
  const clear = db.prepare(`DELETE FROM env_vars WHERE project_id = ?`);
  const insert = db.prepare(
    `INSERT INTO env_vars (project_id, name, status, is_public) VALUES (?, ?, ?, ?)`
  );
  const tx = db.transaction((items: typeof vars) => {
    clear.run(projectId);
    for (const v of items) insert.run(projectId, v.name, v.status, v.is_public ? 1 : 0);
  });
  tx(vars);
}

export function listProjectEnvVars(projectId: number): EnvVar[] {
  return db.prepare(`SELECT * FROM env_vars WHERE project_id = ? ORDER BY name`).all(projectId) as EnvVar[];
}

// ---------------------------------------------------------------------------
// Important files
// ---------------------------------------------------------------------------

export function setProjectFiles(projectId: number, files: Omit<ImportantFile, "id" | "project_id">[]): void {
  const clear = db.prepare(`DELETE FROM important_files WHERE project_id = ?`);
  const insert = db.prepare(
    `INSERT INTO important_files (project_id, path, purpose, importance, safe_to_modify, related_functionality)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const tx = db.transaction((items: typeof files) => {
    clear.run(projectId);
    for (const f of items) {
      insert.run(projectId, f.path, f.purpose ?? null, f.importance, f.safe_to_modify ? 1 : 0, f.related_functionality ?? null);
    }
  });
  tx(files);
}

export function listProjectFiles(projectId: number): ImportantFile[] {
  return db.prepare(`SELECT * FROM important_files WHERE project_id = ? ORDER BY importance, path`).all(projectId) as ImportantFile[];
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export function listProjectTasks(projectId: number): Task[] {
  return db.prepare(`SELECT * FROM tasks WHERE project_id = ? ORDER BY position, id`).all(projectId) as Task[];
}

export function listAllTasks(): (Task & { project_name: string; project_slug: string })[] {
  return db
    .prepare(
      `SELECT t.*, p.name AS project_name, p.slug AS project_slug
       FROM tasks t JOIN projects p ON p.id = t.project_id
       ORDER BY t.status, t.priority DESC, t.id`
    )
    .all() as (Task & { project_name: string; project_slug: string })[];
}

export function createTask(input: Partial<Task> & { project_id: number; title: string }): Task {
  const info = db
    .prepare(
      `INSERT INTO tasks (project_id, title, description, status, priority, due_date, labels, estimated_effort, notes)
       VALUES (@project_id, @title, @description, @status, @priority, @due_date, @labels, @estimated_effort, @notes)`
    )
    .run({
      project_id: input.project_id,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "backlog",
      priority: input.priority ?? "medium",
      due_date: input.due_date ?? null,
      labels: input.labels ?? null,
      estimated_effort: input.estimated_effort ?? null,
      notes: input.notes ?? null,
    });
  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(info.lastInsertRowid) as Task;
}

const TASK_EDITABLE_FIELDS = [
  "title",
  "description",
  "status",
  "priority",
  "due_date",
  "labels",
  "estimated_effort",
  "notes",
  "position",
] as const;

export function updateTask(id: number, patch: Partial<Task>): Task | undefined {
  const fields = TASK_EDITABLE_FIELDS.filter((f) => f in patch);
  if (fields.length === 0) return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as Task;
  const setClause = fields.map((f) => `${f} = @${f}`).join(", ");
  const params: Record<string, unknown> = { id };
  for (const f of fields) params[f] = (patch as Record<string, unknown>)[f] ?? null;
  db.prepare(`UPDATE tasks SET ${setClause}, updated_at = @updated_at WHERE id = @id`).run({
    ...params,
    updated_at: now(),
  });
  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as Task;
}

export function deleteTask(id: number): void {
  db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id);
}

// ---------------------------------------------------------------------------
// Bugs
// ---------------------------------------------------------------------------

export function listProjectBugs(projectId: number): Bug[] {
  return db.prepare(`SELECT * FROM bugs WHERE project_id = ? ORDER BY severity, id DESC`).all(projectId) as Bug[];
}

export function listAllBugs(): (Bug & { project_name: string; project_slug: string })[] {
  return db
    .prepare(
      `SELECT b.*, p.name AS project_name, p.slug AS project_slug
       FROM bugs b JOIN projects p ON p.id = b.project_id
       ORDER BY CASE b.severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, b.id DESC`
    )
    .all() as (Bug & { project_name: string; project_slug: string })[];
}

export function createBug(input: Partial<Bug> & { project_id: number; title: string }): Bug {
  const info = db
    .prepare(
      `INSERT INTO bugs (project_id, title, severity, description, repro_steps, status, related_files, workaround, date_discovered, date_fixed)
       VALUES (@project_id, @title, @severity, @description, @repro_steps, @status, @related_files, @workaround, @date_discovered, @date_fixed)`
    )
    .run({
      project_id: input.project_id,
      title: input.title,
      severity: input.severity ?? "medium",
      description: input.description ?? null,
      repro_steps: input.repro_steps ?? null,
      status: input.status ?? "open",
      related_files: input.related_files ?? null,
      workaround: input.workaround ?? null,
      date_discovered: input.date_discovered ?? now(),
      date_fixed: input.date_fixed ?? null,
    });
  return db.prepare(`SELECT * FROM bugs WHERE id = ?`).get(info.lastInsertRowid) as Bug;
}

const BUG_EDITABLE_FIELDS = [
  "title",
  "severity",
  "description",
  "repro_steps",
  "status",
  "related_files",
  "workaround",
  "date_discovered",
  "date_fixed",
] as const;

export function updateBug(id: number, patch: Partial<Bug>): Bug | undefined {
  const fields = BUG_EDITABLE_FIELDS.filter((f) => f in patch);
  if (fields.length === 0) return db.prepare(`SELECT * FROM bugs WHERE id = ?`).get(id) as Bug;
  const setClause = fields.map((f) => `${f} = @${f}`).join(", ");
  const params: Record<string, unknown> = { id };
  for (const f of fields) params[f] = (patch as Record<string, unknown>)[f] ?? null;
  db.prepare(`UPDATE bugs SET ${setClause} WHERE id = @id`).run(params);
  return db.prepare(`SELECT * FROM bugs WHERE id = ?`).get(id) as Bug;
}

export function deleteBug(id: number): void {
  db.prepare(`DELETE FROM bugs WHERE id = ?`).run(id);
}

// ---------------------------------------------------------------------------
// Changelog
// ---------------------------------------------------------------------------

export function listProjectChangelog(projectId: number): ChangelogEntry[] {
  return db
    .prepare(`SELECT * FROM changelog_entries WHERE project_id = ? ORDER BY entry_date DESC, id DESC`)
    .all(projectId) as ChangelogEntry[];
}

export function addChangelogEntries(
  projectId: number,
  entries: { version?: string | null; entry_date?: string | null; summary: string; source?: "manual" | "git"; commit_sha?: string | null }[]
): void {
  const insert = db.prepare(
    `INSERT INTO changelog_entries (project_id, version, entry_date, summary, source, commit_sha)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const tx = db.transaction((items: typeof entries) => {
    for (const e of items) {
      insert.run(projectId, e.version ?? null, e.entry_date ?? null, e.summary, e.source ?? "manual", e.commit_sha ?? null);
    }
  });
  tx(entries);
}

export function deleteChangelogEntry(id: number): void {
  db.prepare(`DELETE FROM changelog_entries WHERE id = ?`).run(id);
}

// ---------------------------------------------------------------------------
// Claude knowledge
// ---------------------------------------------------------------------------

export function getClaudeKnowledge(projectId: number): ClaudeKnowledge | undefined {
  return db.prepare(`SELECT * FROM claude_knowledge WHERE project_id = ?`).get(projectId) as ClaudeKnowledge | undefined;
}

export function upsertClaudeKnowledge(projectId: number, patch: Partial<ClaudeKnowledge>): ClaudeKnowledge {
  const existing = getClaudeKnowledge(projectId);
  const merged = {
    has_claude_md: patch.has_claude_md ?? existing?.has_claude_md ?? 0,
    has_readme: patch.has_readme ?? existing?.has_readme ?? 0,
    architecture_notes: patch.architecture_notes ?? existing?.architecture_notes ?? null,
    dev_rules: patch.dev_rules ?? existing?.dev_rules ?? null,
    known_limitations: patch.known_limitations ?? existing?.known_limitations ?? null,
    important_decisions: patch.important_decisions ?? existing?.important_decisions ?? null,
    do_not_change: patch.do_not_change ?? existing?.do_not_change ?? null,
    check_before_modifying: patch.check_before_modifying ?? existing?.check_before_modifying ?? null,
    documentation_score: patch.documentation_score ?? existing?.documentation_score ?? null,
  };
  db.prepare(
    `INSERT INTO claude_knowledge (project_id, has_claude_md, has_readme, architecture_notes, dev_rules, known_limitations, important_decisions, do_not_change, check_before_modifying, documentation_score, updated_at)
     VALUES (@project_id, @has_claude_md, @has_readme, @architecture_notes, @dev_rules, @known_limitations, @important_decisions, @do_not_change, @check_before_modifying, @documentation_score, @updated_at)
     ON CONFLICT(project_id) DO UPDATE SET
       has_claude_md = excluded.has_claude_md,
       has_readme = excluded.has_readme,
       architecture_notes = excluded.architecture_notes,
       dev_rules = excluded.dev_rules,
       known_limitations = excluded.known_limitations,
       important_decisions = excluded.important_decisions,
       do_not_change = excluded.do_not_change,
       check_before_modifying = excluded.check_before_modifying,
       documentation_score = excluded.documentation_score,
       updated_at = excluded.updated_at`
  ).run({ project_id: projectId, ...merged, updated_at: now() });
  return getClaudeKnowledge(projectId)!;
}

// ---------------------------------------------------------------------------
// Scans
// ---------------------------------------------------------------------------

export function recordScan(
  projectId: number,
  reportJson: string,
  computedHealth: string | null,
  recommendedActions: string[]
): ScanRecord {
  const info = db
    .prepare(
      `INSERT INTO scans (project_id, report_json, computed_health, recommended_actions) VALUES (?, ?, ?, ?)`
    )
    .run(projectId, reportJson, computedHealth, JSON.stringify(recommendedActions));
  db.prepare(`UPDATE projects SET last_scanned_at = ? WHERE id = ?`).run(now(), projectId);
  return db.prepare(`SELECT * FROM scans WHERE id = ?`).get(info.lastInsertRowid) as ScanRecord;
}

export function latestScan(projectId: number): ScanRecord | undefined {
  return db
    .prepare(`SELECT * FROM scans WHERE project_id = ? ORDER BY scanned_at DESC LIMIT 1`)
    .get(projectId) as ScanRecord | undefined;
}

// ---------------------------------------------------------------------------
// Relationships (System Map)
// ---------------------------------------------------------------------------

export function listRelationships(): ProjectRelationship[] {
  return db.prepare(`SELECT * FROM project_relationships`).all() as ProjectRelationship[];
}

export function addRelationship(rel: Omit<ProjectRelationship, "id">): ProjectRelationship {
  const info = db
    .prepare(
      `INSERT INTO project_relationships (from_project_id, to_project_id, to_technology_id, relationship_type, description)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(rel.from_project_id, rel.to_project_id, rel.to_technology_id, rel.relationship_type, rel.description ?? null);
  return db.prepare(`SELECT * FROM project_relationships WHERE id = ?`).get(info.lastInsertRowid) as ProjectRelationship;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function getSetting(key: string): string | undefined {
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as { value: string } | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string): void {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}

export function getScanRoots(): string[] {
  const raw = getSetting("scan_roots");
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export function setScanRoots(roots: string[]): void {
  setSetting("scan_roots", JSON.stringify(roots));
}

// ---------------------------------------------------------------------------
// Global search
// ---------------------------------------------------------------------------

export interface SearchResult {
  kind: "project" | "task" | "bug" | "technology";
  id: number | string;
  title: string;
  subtitle: string;
  href: string;
}

export function globalSearch(query: string): SearchResult[] {
  const q = `%${query.toLowerCase()}%`;
  const results: SearchResult[] = [];

  const projects = db
    .prepare(`SELECT * FROM projects WHERE lower(name) LIKE ? OR lower(description) LIKE ? LIMIT 15`)
    .all(q, q) as Project[];
  for (const p of projects) {
    results.push({ kind: "project", id: p.id, title: p.name, subtitle: p.description ?? p.type, href: `/projects/${p.slug}` });
  }

  const tasks = db
    .prepare(
      `SELECT t.*, p.slug AS project_slug, p.name AS project_name FROM tasks t JOIN projects p ON p.id = t.project_id
       WHERE lower(t.title) LIKE ? LIMIT 15`
    )
    .all(q) as (Task & { project_slug: string; project_name: string })[];
  for (const t of tasks) {
    results.push({ kind: "task", id: t.id, title: t.title, subtitle: `${t.project_name} · ${t.status}`, href: `/projects/${t.project_slug}?tab=tasks` });
  }

  const bugs = db
    .prepare(
      `SELECT b.*, p.slug AS project_slug, p.name AS project_name FROM bugs b JOIN projects p ON p.id = b.project_id
       WHERE lower(b.title) LIKE ? LIMIT 15`
    )
    .all(q) as (Bug & { project_slug: string; project_name: string })[];
  for (const b of bugs) {
    results.push({ kind: "bug", id: b.id, title: b.title, subtitle: `${b.project_name} · ${b.severity}`, href: `/projects/${b.project_slug}?tab=bugs` });
  }

  const techs = db
    .prepare(`SELECT * FROM technologies WHERE lower(name) LIKE ? LIMIT 15`)
    .all(q) as { id: number; name: string; category: string }[];
  for (const t of techs) {
    results.push({ kind: "technology", id: t.id, title: t.name, subtitle: t.category, href: `/technologies?highlight=${encodeURIComponent(t.name)}` });
  }

  return results;
}
