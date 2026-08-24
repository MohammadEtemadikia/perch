export type ProjectType =
  | "web_app"
  | "website"
  | "saas"
  | "automation"
  | "ai_tool"
  | "mobile_app"
  | "desktop_app"
  | "api"
  | "experiment"
  | "internal_tool"
  | "other";

export type ProjectStatus =
  | "idea"
  | "prototype"
  | "development"
  | "active"
  | "production"
  | "paused"
  | "completed"
  | "archived";

export type Priority = "low" | "medium" | "high" | "critical";

export type Health = "healthy" | "needs_attention" | "broken" | "archived" | "unknown";

export type TaskStatus = "backlog" | "todo" | "in_progress" | "blocked" | "review" | "done";

export type BugSeverity = "critical" | "high" | "medium" | "low";

export type BugStatus = "open" | "in_progress" | "fixed" | "wont_fix" | "duplicate";

export type TechCategory =
  | "framework"
  | "language"
  | "runtime"
  | "package_manager"
  | "database"
  | "css"
  | "auth"
  | "hosting"
  | "api"
  | "service"
  | "integration"
  | "other";

export interface Project {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  purpose: string | null;
  type: ProjectType;
  status: ProjectStatus;
  priority: Priority;
  health: Health;
  health_is_manual: 0 | 1;
  owner: string | null;
  version: string | null;
  local_path: string | null;
  git_remote_url: string | null;
  production_url: string | null;
  staging_url: string | null;
  completion_percentage: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  last_scanned_at: string | null;
}

export interface ProjectWithCounts extends Project {
  open_tasks: number;
  open_bugs: number;
  tags: string[];
  technologies: { name: string; category: TechCategory }[];
}

export interface Tag {
  id: number;
  name: string;
}

export interface Technology {
  id: number;
  name: string;
  category: TechCategory;
}

export interface EnvVar {
  id: number;
  project_id: number;
  name: string;
  status: "configured" | "missing" | "unknown";
  is_public: 0 | 1;
}

export interface ImportantFile {
  id: number;
  project_id: number;
  path: string;
  purpose: string | null;
  importance: "critical" | "high" | "medium" | "low";
  safe_to_modify: 0 | 1;
  related_functionality: string | null;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  labels: string | null; // JSON array
  estimated_effort: string | null;
  notes: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Bug {
  id: number;
  project_id: number;
  title: string;
  severity: BugSeverity;
  description: string | null;
  repro_steps: string | null;
  status: BugStatus;
  related_files: string | null; // JSON array
  workaround: string | null;
  date_discovered: string | null;
  date_fixed: string | null;
  created_at: string;
}

export interface ChangelogEntry {
  id: number;
  project_id: number;
  version: string | null;
  entry_date: string | null;
  summary: string;
  source: "manual" | "git";
  commit_sha: string | null;
  created_at: string;
}

export interface ClaudeKnowledge {
  project_id: number;
  has_claude_md: 0 | 1;
  has_readme: 0 | 1;
  architecture_notes: string | null;
  dev_rules: string | null;
  known_limitations: string | null;
  important_decisions: string | null;
  do_not_change: string | null;
  check_before_modifying: string | null;
  documentation_score: number | null;
  updated_at: string;
}

export interface ScanRecord {
  id: number;
  project_id: number;
  scanned_at: string;
  report_json: string;
  computed_health: Health | null;
  recommended_actions: string | null; // JSON array
}

export interface ProjectRelationship {
  id: number;
  from_project_id: number;
  to_project_id: number | null;
  to_technology_id: number | null;
  relationship_type: string;
  description: string | null;
}
