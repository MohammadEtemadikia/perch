import fs from "node:fs";
import path from "node:path";
import type { Project } from "./types";

export interface OrgCheck {
  label: string;
  level: "pass" | "warn" | "fail";
}

export interface MovePlan {
  currentPath: string;
  recommendedPath: string;
  destinationExists: boolean;
  checks: OrgCheck[];
  canProceed: boolean;
}

const ORG_FOLDERS = ["00_HQ", "01_ACTIVE", "02_PROTOTYPES", "03_PAUSED", "04_COMPLETED", "05_ARCHIVED", "99_SHARED"] as const;

export function recommendedFolderFor(project: Project): (typeof ORG_FOLDERS)[number] {
  switch (project.status) {
    case "idea":
    case "prototype":
      return "02_PROTOTYPES";
    case "development":
    case "active":
    case "production":
      return "01_ACTIVE";
    case "paused":
      return "03_PAUSED";
    case "completed":
      return "04_COMPLETED";
    case "archived":
      return "05_ARCHIVED";
    default:
      return "01_ACTIVE";
  }
}

export function suggestPath(organizationRoot: string, project: Project): string {
  const folder = recommendedFolderFor(project);
  const safeName = project.name.replace(/[\\/:*?"<>|]/g, "").trim();
  return path.join(organizationRoot, folder, safeName);
}

function referencesAbsolutePath(dir: string, targetPath: string): boolean {
  const candidates = ["package.json", "next.config.ts", "next.config.mjs", "wrangler.jsonc", ".env"];
  for (const file of candidates) {
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) continue;
    try {
      const content = fs.readFileSync(full, "utf8");
      if (content.includes(targetPath)) return true;
    } catch {
      /* unreadable, skip */
    }
  }
  return false;
}

export function buildMovePlan(project: Project, destination: string): MovePlan {
  const checks: OrgCheck[] = [];
  const current = project.local_path;

  if (!current) {
    return {
      currentPath: "",
      recommendedPath: destination,
      destinationExists: fs.existsSync(destination),
      checks: [{ label: "This project has no local path set — nothing to move.", level: "fail" }],
      canProceed: false,
    };
  }

  const sourceExists = fs.existsSync(current);
  checks.push({ label: sourceExists ? "Source folder exists" : "Source folder does not exist", level: sourceExists ? "pass" : "fail" });

  const isGitRepo = fs.existsSync(path.join(current, ".git"));
  checks.push({ label: isGitRepo ? "Git repository detected" : "No git repository (nothing to lose there, but also no history)", level: isGitRepo ? "pass" : "warn" });

  const hasPackageJson = fs.existsSync(path.join(current, "package.json"));
  checks.push({ label: hasPackageJson ? "package.json detected" : "No package.json found", level: hasPackageJson ? "pass" : "warn" });

  const hasAbsoluteRefs = sourceExists ? referencesAbsolutePath(current, current) : false;
  checks.push({
    label: hasAbsoluteRefs ? "Absolute path references found in config files — review before moving" : "No absolute path references detected in common config files",
    level: hasAbsoluteRefs ? "warn" : "pass",
  });

  const hasEnv = fs.existsSync(path.join(current, ".env"));
  if (hasEnv) checks.push({ label: "Has a .env file — double check nothing inside it hardcodes the current path", level: "warn" });

  const hasDeployConfig = ["wrangler.jsonc", "vercel.json", "netlify.toml", "electron-builder.yml"].some((f) => fs.existsSync(path.join(current, f)));
  if (hasDeployConfig) checks.push({ label: "Deployment config present — check it after moving", level: "warn" });

  const destinationExists = fs.existsSync(destination);
  checks.push({ label: destinationExists ? "Destination already exists — refusing to overwrite" : "Destination path is free", level: destinationExists ? "fail" : "pass" });

  const samePath = path.resolve(current) === path.resolve(destination);
  if (samePath) checks.push({ label: "Destination is identical to the current path", level: "fail" });

  const canProceed = sourceExists && !destinationExists && !samePath;

  return { currentPath: current, recommendedPath: destination, destinationExists, checks, canProceed };
}

export interface MoveResult {
  ok: boolean;
  reason?: string;
  newPath?: string;
}

/** Performs the move. Caller must have already shown the plan and gotten explicit confirmation. */
export function performMove(project: Project, destination: string): MoveResult {
  const plan = buildMovePlan(project, destination);
  if (!plan.canProceed) {
    return { ok: false, reason: "Preconditions failed — re-run the dry run, this should not have been called." };
  }
  try {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.cpSync(project.local_path!, destination, { recursive: true, errorOnExist: true });
    const sourceCount = countFiles(project.local_path!);
    const destCount = countFiles(destination);
    if (sourceCount !== destCount) {
      // Something didn't copy cleanly — do not touch the original.
      fs.rmSync(destination, { recursive: true, force: true });
      return { ok: false, reason: `File count mismatch after copy (source ${sourceCount}, destination ${destCount}) — aborted, original left untouched.` };
    }
    fs.rmSync(project.local_path!, { recursive: true, force: true });
    return { ok: true, newPath: destination };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

function countFiles(dir: string): number {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(full);
    else count += 1;
  }
  return count;
}

export { ORG_FOLDERS };
