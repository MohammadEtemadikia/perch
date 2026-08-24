import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export interface GitInfo {
  isRepo: boolean;
  branch: string | null;
  lastCommit: { sha: string; message: string; author: string; date: string } | null;
  remoteUrl: string | null;
  branches: string[];
  modifiedFiles: string[];
  untrackedFiles: string[];
  isClean: boolean;
  error: string | null;
}

function run(cwd: string, args: string[]): { ok: boolean; stdout: string } {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.error || result.status !== 0) {
    return { ok: false, stdout: "" };
  }
  return { ok: true, stdout: result.stdout.trim() };
}

/** Read-only inspection only. Never call this with any command that mutates the repo. */
export function getGitInfo(localPath: string | null): GitInfo {
  const empty: GitInfo = {
    isRepo: false,
    branch: null,
    lastCommit: null,
    remoteUrl: null,
    branches: [],
    modifiedFiles: [],
    untrackedFiles: [],
    isClean: true,
    error: null,
  };

  if (!localPath) return { ...empty, error: "No local path set for this project." };
  if (!fs.existsSync(localPath)) return { ...empty, error: `Path does not exist: ${localPath}` };
  if (!fs.existsSync(path.join(localPath, ".git"))) {
    return { ...empty, error: "Not a git repository." };
  }

  const branch = run(localPath, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const log = run(localPath, ["log", "-1", "--format=%H%n%s%n%an%n%aI"]);
  const remote = run(localPath, ["remote", "get-url", "origin"]);
  const branches = run(localPath, ["branch", "--format=%(refname:short)"]);
  const status = run(localPath, ["status", "--porcelain"]);

  let lastCommit: GitInfo["lastCommit"] = null;
  if (log.ok && log.stdout) {
    const [sha, message, author, date] = log.stdout.split("\n");
    lastCommit = { sha, message, author, date };
  }

  const modifiedFiles: string[] = [];
  const untrackedFiles: string[] = [];
  if (status.ok) {
    for (const line of status.stdout.split("\n").filter(Boolean)) {
      const code = line.slice(0, 2);
      const file = line.slice(3);
      if (code === "??") untrackedFiles.push(file);
      else modifiedFiles.push(file);
    }
  }

  return {
    isRepo: true,
    branch: branch.ok ? branch.stdout : null,
    lastCommit,
    remoteUrl: remote.ok ? remote.stdout : null,
    branches: branches.ok ? branches.stdout.split("\n").filter(Boolean) : [],
    modifiedFiles,
    untrackedFiles,
    isClean: modifiedFiles.length === 0 && untrackedFiles.length === 0,
    error: null,
  };
}

export interface GitLogEntry {
  sha: string;
  message: string;
  author: string;
  date: string;
}

/** Read-only. Used by the changelog generator to propose entries from history. */
export function getRecentCommits(localPath: string | null, limit = 30): GitLogEntry[] {
  if (!localPath || !fs.existsSync(path.join(localPath, ".git"))) return [];
  const result = run(localPath, ["log", `-${limit}`, "--format=%H%x1f%s%x1f%an%x1f%aI"]);
  if (!result.ok || !result.stdout) return [];
  return result.stdout
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [sha, message, author, date] = line.split("\x1f");
      return { sha, message, author, date };
    });
}
