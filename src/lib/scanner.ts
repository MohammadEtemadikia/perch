import fs from "node:fs";
import path from "node:path";
import { getGitInfo, type GitInfo } from "./git";
import type { TechCategory } from "./types";

export interface ScanTech {
  name: string;
  category: TechCategory;
  detail?: string;
}

export interface ScanEnvVar {
  name: string;
  status: "configured" | "missing" | "unknown";
  isPublic: boolean;
}

export interface ScanReport {
  path: string;
  exists: boolean;
  error: string | null;
  name: string | null;
  description: string | null;
  hasReadme: boolean;
  hasClaudeMd: boolean;
  hasEnvExample: boolean;
  hasEnvFile: boolean;
  envVars: ScanEnvVar[];
  technologies: ScanTech[];
  scripts: Record<string, string>;
  packageManager: "npm" | "yarn" | "pnpm" | "unknown";
  language: "typescript" | "javascript" | "unknown";
  hasDocker: boolean;
  hasElectron: boolean;
  deploymentTargets: string[];
  git: GitInfo;
  topLevelDirs: string[];
  documentationScore: number;
  recommendedActions: string[];
  scannedAt: string;
}

const FRAMEWORK_DEPS: Record<string, string> = {
  next: "Next.js",
  react: "React",
  "react-dom": "React DOM",
  vue: "Vue",
  svelte: "Svelte",
  express: "Express",
  electron: "Electron",
  remotion: "Remotion",
  "@remotion/cli": "Remotion",
};

const DATABASE_DEPS: Record<string, string> = {
  "better-sqlite3": "SQLite",
  sqlite3: "SQLite",
  pg: "PostgreSQL",
  mysql2: "MySQL",
  mongodb: "MongoDB",
  ioredis: "Redis",
  redis: "Redis",
  "@prisma/client": "Prisma",
  "@electric-sql/pglite": "PGlite (embedded Postgres)",
};

const AUTH_DEPS: Record<string, string> = {
  "next-auth": "NextAuth",
  jose: "JWT (jose)",
  jsonwebtoken: "JWT",
  bcryptjs: "bcrypt",
  bcrypt: "bcrypt",
};

const SERVICE_DEPS: Record<string, string> = {
  googleapis: "Google APIs",
  stripe: "Stripe",
  "@supabase/supabase-js": "Supabase",
  imapflow: "IMAP (email)",
  nodemailer: "SMTP (email)",
  twilio: "Twilio",
};

function readJsonSafe(filePath: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function parseEnvFileNames(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const names: string[] = [];
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(trimmed);
      if (match) names.push(match[1]);
    }
    return names;
  } catch {
    return [];
  }
}

function detectPackageManager(dir: string): ScanReport["packageManager"] {
  if (fs.existsSync(path.join(dir, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(dir, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(dir, "package-lock.json"))) return "npm";
  return "unknown";
}

/**
 * Inspects a folder on disk and produces a factual report. Never invents data:
 * anything not detectable is left null/empty and surfaced as "unknown" in the UI.
 */
export function scanProjectFolder(targetPath: string): ScanReport {
  const scannedAt = new Date().toISOString();

  if (!fs.existsSync(targetPath)) {
    return {
      path: targetPath,
      exists: false,
      error: "Path does not exist.",
      name: null,
      description: null,
      hasReadme: false,
      hasClaudeMd: false,
      hasEnvExample: false,
      hasEnvFile: false,
      envVars: [],
      technologies: [],
      scripts: {},
      packageManager: "unknown",
      language: "unknown",
      hasDocker: false,
      hasElectron: false,
      deploymentTargets: [],
      git: getGitInfo(null),
      topLevelDirs: [],
      documentationScore: 0,
      recommendedActions: [],
      scannedAt,
    };
  }

  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  const has = (fileName: string) => entries.some((e) => e.name === fileName);
  const topLevelDirs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules")
    .map((e) => e.name)
    .sort();

  const pkgPath = path.join(targetPath, "package.json");
  const pkg = fs.existsSync(pkgPath) ? readJsonSafe(pkgPath) : null;

  const technologies: ScanTech[] = [];
  const allDeps: Record<string, string> = {
    ...((pkg?.dependencies as Record<string, string>) ?? {}),
    ...((pkg?.devDependencies as Record<string, string>) ?? {}),
  };

  for (const [dep, label] of Object.entries(FRAMEWORK_DEPS)) {
    if (allDeps[dep]) technologies.push({ name: label, category: "framework", detail: allDeps[dep] });
  }
  for (const [dep, label] of Object.entries(DATABASE_DEPS)) {
    if (allDeps[dep]) technologies.push({ name: label, category: "database" });
  }
  for (const [dep, label] of Object.entries(AUTH_DEPS)) {
    if (allDeps[dep]) technologies.push({ name: label, category: "auth" });
  }
  for (const [dep, label] of Object.entries(SERVICE_DEPS)) {
    if (allDeps[dep]) technologies.push({ name: label, category: "service" });
  }
  if (allDeps["tailwindcss"]) technologies.push({ name: "Tailwind CSS", category: "css" });
  if (allDeps["typescript"]) technologies.push({ name: "TypeScript", category: "language" });

  const hasTsconfig = has("tsconfig.json");
  const language: ScanReport["language"] = hasTsconfig || allDeps["typescript"] ? "typescript" : pkg ? "javascript" : "unknown";
  if (!allDeps["typescript"] && language === "javascript") {
    technologies.push({ name: "JavaScript", category: "language" });
  }

  const hasWrangler = has("wrangler.jsonc") || has("wrangler.toml");
  const hasVercel = has("vercel.json");
  const hasNetlify = has("netlify.toml");
  const hasDockerCompose = has("docker-compose.yml") || has("docker-compose.prod.yml");
  const hasDockerfile = has("Dockerfile");
  const hasElectronBuilder = has("electron-builder.yml") || has("electron-builder.yaml");

  const deploymentTargets: string[] = [];
  if (hasWrangler) deploymentTargets.push("Cloudflare Workers");
  if (hasVercel) deploymentTargets.push("Vercel");
  if (hasNetlify) deploymentTargets.push("Netlify");
  if (hasElectronBuilder) deploymentTargets.push("Electron desktop (electron-builder)");
  if (hasDockerCompose || hasDockerfile) deploymentTargets.push("Docker / self-hosted VPS");

  if (hasWrangler) technologies.push({ name: "Cloudflare Workers", category: "hosting" });
  if (hasVercel) technologies.push({ name: "Vercel", category: "hosting" });
  if (hasNetlify) technologies.push({ name: "Netlify", category: "hosting" });

  const pm = detectPackageManager(targetPath);
  technologies.push({ name: pm === "unknown" ? "npm (assumed)" : pm, category: "package_manager" });

  // Prisma schema: detect declared datasource provider (sqlite/postgresql/mysql).
  const prismaSchemaPath = path.join(targetPath, "prisma", "schema.prisma");
  if (fs.existsSync(prismaSchemaPath)) {
    try {
      const schema = fs.readFileSync(prismaSchemaPath, "utf8");
      const providerMatch = /datasource\s+\w+\s*{[^}]*provider\s*=\s*"(\w+)"/s.exec(schema);
      if (providerMatch) {
        const provider = providerMatch[1];
        const label = provider === "postgresql" ? "PostgreSQL" : provider === "sqlite" ? "SQLite" : provider === "mysql" ? "MySQL" : provider;
        if (!technologies.some((t) => t.name === label)) technologies.push({ name: label, category: "database" });
      }
    } catch {
      /* unreadable schema, skip */
    }
  }

  const envExamplePath = fs.existsSync(path.join(targetPath, ".env.example"))
    ? path.join(targetPath, ".env.example")
    : fs.existsSync(path.join(targetPath, ".env.sample"))
      ? path.join(targetPath, ".env.sample")
      : null;
  const envFilePath = path.join(targetPath, ".env");
  const envLocalPath = path.join(targetPath, ".env.local");
  const hasEnvFile = fs.existsSync(envFilePath) || fs.existsSync(envLocalPath);
  const hasEnvExample = envExamplePath !== null;

  const declaredNames = new Set<string>();
  if (envExamplePath) parseEnvFileNames(envExamplePath).forEach((n) => declaredNames.add(n));
  const actualNames = new Set<string>([
    ...(fs.existsSync(envFilePath) ? parseEnvFileNames(envFilePath) : []),
    ...(fs.existsSync(envLocalPath) ? parseEnvFileNames(envLocalPath) : []),
  ]);
  actualNames.forEach((n) => declaredNames.add(n));

  const envVars: ScanEnvVar[] = Array.from(declaredNames)
    .sort()
    .map((name) => ({
      name,
      status: hasEnvFile ? (actualNames.has(name) ? "configured" : "missing") : hasEnvExample ? "unknown" : "unknown",
      isPublic: name.startsWith("NEXT_PUBLIC_"),
    }));

  const hasReadme = has("README.md") || has("readme.md");
  const hasClaudeMd = has("CLAUDE.md") || has("AGENTS.md");

  let documentationScore = 0;
  if (hasReadme) documentationScore += 40;
  if (hasClaudeMd) documentationScore += 35;
  if (hasEnvExample) documentationScore += 15;
  if (pkg?.description) documentationScore += 10;
  documentationScore = Math.min(100, documentationScore);

  const git = getGitInfo(targetPath);

  const recommendedActions: string[] = [];
  if (!hasClaudeMd) recommendedActions.push("Create a CLAUDE.md so another Claude session understands this project.");
  if (!hasReadme) recommendedActions.push("Add a README.md describing what this project does.");
  if (!git.isRepo) recommendedActions.push("Initialize a git repository — this project currently has no version history.");
  else if (!git.isClean) recommendedActions.push("Commit or review the uncommitted changes sitting in the working tree.");
  if (hasEnvFile && !hasEnvExample) recommendedActions.push("Add a .env.example so required environment variables are documented.");
  if (!pkg && entries.length > 0) recommendedActions.push("No package.json found — confirm this is meant to be a Node/JS project.");

  return {
    path: targetPath,
    exists: true,
    error: null,
    name: (pkg?.name as string) ?? path.basename(targetPath),
    description: (pkg?.description as string) ?? null,
    hasReadme,
    hasClaudeMd,
    hasEnvExample,
    hasEnvFile,
    envVars,
    technologies,
    scripts: (pkg?.scripts as Record<string, string>) ?? {},
    packageManager: pm,
    language,
    hasDocker: hasDockerfile || hasDockerCompose,
    hasElectron: hasElectronBuilder || Boolean(allDeps["electron"]),
    deploymentTargets,
    git,
    topLevelDirs,
    documentationScore,
    recommendedActions,
    scannedAt,
  };
}

export type ComputedHealth = "healthy" | "needs_attention" | "broken";

export function computeHealth(report: ScanReport): ComputedHealth {
  if (report.error || !report.exists) return "broken";
  // No version history at all is a standing risk regardless of how good the
  // docs are — never let doc quality mask a project with zero git history.
  if (!report.git.isRepo) return "needs_attention";
  if (report.documentationScore < 40) return "needs_attention";
  if (!report.git.isClean && report.git.modifiedFiles.length + report.git.untrackedFiles.length > 20) {
    return "needs_attention";
  }
  return "healthy";
}
