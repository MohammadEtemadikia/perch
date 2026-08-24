/**
 * Seeds the database with the 10 real projects found during the initial
 * environment audit (2026-08-24). Every field here is taken directly from
 * what was actually observed on disk — nothing invented. Safe to re-run:
 * it skips any project whose local_path is already recorded.
 */
import { db } from "../src/lib/db";
import {
  createProject,
  getProjectBySlug,
  setProjectTags,
  setProjectTechnologies,
  setProjectEnvVars,
  upsertClaudeKnowledge,
  createTask,
  slugify,
} from "../src/lib/queries";
import type { ProjectStatus, ProjectType, Priority, TechCategory } from "../src/lib/types";

interface SeedTech {
  name: string;
  category: TechCategory;
}

interface SeedEnvVar {
  name: string;
  status: "configured" | "missing" | "unknown";
  is_public?: boolean;
}

interface SeedProject {
  name: string;
  description: string;
  purpose?: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: Priority;
  health: "healthy" | "needs_attention" | "broken" | "unknown";
  local_path: string;
  git_remote_url?: string | null;
  tags: string[];
  technologies: SeedTech[];
  envVars: SeedEnvVar[];
  hasReadme: boolean;
  hasClaudeMd: boolean;
  documentationScore: number;
  knownLimitations?: string;
  doNotChange?: string;
  tasks?: string[];
  notes?: string;
}

const HOME = process.env.HOME || "/Users/evimmakelaars";

const PROJECTS: SeedProject[] = [
  {
    name: "AutoFlow",
    description: "اتوفلو — a Persian-language marketplace and services platform for selling ready-made n8n automation workflows.",
    purpose: "Full-stack storefront: catalog, license-tier pricing, cart/checkout, JWT+bcrypt auth, admin panel, blog, and a drag-and-drop page builder.",
    type: "saas",
    status: "development",
    priority: "medium",
    health: "needs_attention",
    local_path: `${HOME}/Documents/Website`,
    tags: ["persian", "n8n", "marketplace", "cloudflare"],
    technologies: [
      { name: "Next.js", category: "framework" },
      { name: "React", category: "framework" },
      { name: "TypeScript", category: "language" },
      { name: "Tailwind CSS", category: "css" },
      { name: "Prisma", category: "database" },
      { name: "SQLite", category: "database" },
      { name: "JWT (jose)", category: "auth" },
      { name: "bcrypt", category: "auth" },
      { name: "Cloudflare Workers", category: "hosting" },
      { name: "npm", category: "package_manager" },
    ],
    envVars: [
      { name: "DATABASE_URL", status: "configured" },
      { name: "AUTH_SECRET", status: "configured" },
      { name: "NEXT_PUBLIC_SITE_URL", status: "configured", is_public: true },
    ],
    hasReadme: true,
    hasClaudeMd: false,
    documentationScore: 40,
    knownLimitations:
      "No git repository — zero version history. README documents plaintext demo admin/user credentials that must be rotated before any real deployment. wrangler.jsonc ships a placeholder AUTH_SECRET as a plain var instead of a wrangler secret.",
    tasks: [
      "Initialize a git repository — currently no version history at all",
      "Rotate demo admin/user credentials before any real deployment",
      "Move AUTH_SECRET to a wrangler secret instead of a plaintext var",
      "Replace the simulated payment gateway with a real one",
    ],
  },
  {
    name: "Sip Academy",
    description: "جرعه و یادگیری — a Persian-language coffee, tea, and drink education academy with a no-code lesson builder and admin panel.",
    purpose: "Drink-education platform with dynamic lesson pages, a reusable ingredient library, live theme editor, and ADMIN/EDITOR roles.",
    type: "web_app",
    status: "development",
    priority: "low",
    health: "needs_attention",
    local_path: `${HOME}/Documents/Website/sip-academy`,
    tags: ["persian", "education", "cloudflare"],
    technologies: [
      { name: "Next.js", category: "framework" },
      { name: "React", category: "framework" },
      { name: "TypeScript", category: "language" },
      { name: "Tailwind CSS", category: "css" },
      { name: "Prisma", category: "database" },
      { name: "SQLite", category: "database" },
      { name: "JWT (jose)", category: "auth" },
      { name: "bcrypt", category: "auth" },
      { name: "Cloudflare Workers", category: "hosting" },
      { name: "npm", category: "package_manager" },
    ],
    envVars: [
      { name: "DATABASE_URL", status: "configured" },
      { name: "AUTH_SECRET", status: "configured" },
      { name: "NEXT_PUBLIC_SITE_URL", status: "configured", is_public: true },
    ],
    hasReadme: true,
    hasClaudeMd: false,
    documentationScore: 40,
    knownLimitations:
      "Currently nested inside AutoFlow's project folder (Documents/Website/sip-academy) even though it's a completely unrelated product — looks like it was scaffolded there by accident. Default admin login (admin@sip-academy.ir) documented in plaintext in the README.",
    tasks: [
      "Move this project out of AutoFlow's folder into its own top-level directory",
      "Rotate the default admin credentials documented in the README",
      "Initialize a git repository",
    ],
  },
  {
    name: "Nova",
    description: "The operating system for Evim Makelaars — combines a personal planner (calendar, tasks, notes) with real-estate CRM, listings, viewings, and messaging.",
    purpose: "Local-first business OS: works fully offline via an on-device Persian/English NLP parser, with optional Gemini AI upgrade and optional read-only Realworks integration.",
    type: "internal_tool",
    status: "development",
    priority: "high",
    health: "needs_attention",
    local_path: `${HOME}/Documents/Personal/Planner`,
    tags: ["real-estate", "internal", "persian", "crm"],
    technologies: [
      { name: "Next.js", category: "framework" },
      { name: "React", category: "framework" },
      { name: "TypeScript", category: "language" },
      { name: "Tailwind CSS", category: "css" },
      { name: "PGlite (embedded Postgres)", category: "database" },
      { name: "PostgreSQL", category: "database" },
      { name: "Realworks", category: "integration" },
      { name: "Google Calendar", category: "integration" },
      { name: "Telegram", category: "integration" },
      { name: "WhatsApp", category: "integration" },
      { name: "Google Gemini", category: "service" },
      { name: "npm", category: "package_manager" },
    ],
    envVars: [
      { name: "DATABASE_URL", status: "unknown" },
      { name: "USE_PGLITE", status: "unknown" },
      { name: "AI_API_KEY", status: "unknown" },
      { name: "MAIL_CLIENT_SECRET", status: "unknown" },
      { name: "WP_APP_PASSWORD", status: "unknown" },
      { name: "REALWORKS_BASE_URL", status: "unknown" },
      { name: "SETTINGS_SECRET", status: "configured" },
    ],
    hasReadme: true,
    hasClaudeMd: true,
    documentationScore: 90,
    knownLimitations:
      "No git repository despite being the most mature project audited (47 sequential SQL migrations, ~20 test suites). No cross-device sync yet. Local DB is not encrypted by design. Background jobs (Telegram, reminders, calendar sync) only run while the app tab stays open. \\b regex boundary breaks on Persian text — use (?:^|[\\s،,]) instead. Never sum different currencies.",
    doNotChange: "Never bypass lib/ai/provider.ts for AI calls — everything must degrade gracefully to the on-device parser with no API key required.",
    tasks: [
      "Initialize a git repository — this is the highest-risk project with zero version history",
      "Reconcile README (v0.6) vs AGENTS.md/ROADMAP (v0.1) version mismatch",
    ],
  },
  {
    name: "breakfast-checklist",
    description: "Nightly guest-list upload, shared breakfast checklist, and Google Sheets reporting for a hotel front desk in the Netherlands.",
    purpose: "Front-desk staff check off breakfast per guest from an iPad-pinned web app; data syncs to Google Sheets as the durable store.",
    type: "internal_tool",
    status: "production",
    priority: "medium",
    health: "needs_attention",
    local_path: `${HOME}/Documents/Personal/Guest Checklist`,
    git_remote_url: "https://github.com/MohammadEtemadikia/breakfast-checklist.git",
    tags: ["hospitality", "internal"],
    technologies: [
      { name: "Express", category: "framework" },
      { name: "JavaScript", category: "language" },
      { name: "Google APIs", category: "service" },
      { name: "IMAP (email)", category: "service" },
      { name: "npm", category: "package_manager" },
    ],
    envVars: [
      { name: "OWNER_PASSWORD", status: "unknown" },
      { name: "SESSION_SECRET", status: "unknown" },
      { name: "GOOGLE_SERVICE_ACCOUNT_EMAIL", status: "unknown" },
      { name: "GOOGLE_PRIVATE_KEY", status: "unknown" },
      { name: "GOOGLE_SHEET_ID", status: "unknown" },
      { name: "PORT", status: "unknown" },
    ],
    hasReadme: false,
    hasClaudeMd: false,
    documentationScore: 10,
    knownLimitations: "No README or CLAUDE.md — undocumented for anyone other than its author. Data persistence is a Google Sheet, not a real database.",
    tasks: ["Write a README describing setup and the nightly email flow", "Add a CLAUDE.md for future Claude sessions"],
  },
  {
    name: "Due Diligence Studio",
    description: "Local due diligence report generator for real estate files (EN/NL) — an Electron desktop app that drives your own signed-in Claude Code session.",
    purpose: "Ingests a property document folder and produces a citation-backed due diligence report; no API keys or servers of its own.",
    type: "desktop_app",
    status: "active",
    priority: "medium",
    health: "needs_attention",
    local_path: `${HOME}/Documents/Personal/Due Diligence`,
    tags: ["real-estate", "electron", "desktop"],
    technologies: [
      { name: "Next.js", category: "framework" },
      { name: "React", category: "framework" },
      { name: "Electron", category: "framework" },
      { name: "TypeScript", category: "language" },
      { name: "npm", category: "package_manager" },
    ],
    envVars: [],
    hasReadme: true,
    hasClaudeMd: false,
    documentationScore: 50,
    knownLimitations: "No git repository. Explicitly bills itself as \"a first-pass reader, not a surveyor or a lawyer.\"",
    tasks: ["Initialize a git repository", "Add a CLAUDE.md explaining the sandboxing model to future Claude sessions"],
  },
  {
    name: "Emlaq Landing page",
    description: "Mobile-first Turkish landing page for EmlaQ Hollanda — a conversion-focused rent-vs-buy pitch for Turkish expats in the Netherlands.",
    purpose: "Drives Turkish first-time buyers through a 3-step \"Alım Testi\" buying-readiness quiz.",
    type: "website",
    status: "prototype",
    priority: "high",
    health: "needs_attention",
    local_path: `${HOME}/Documents/Projects/Emlaq Landing page`,
    tags: ["real-estate", "marketing", "turkish"],
    technologies: [
      { name: "Next.js", category: "framework" },
      { name: "React", category: "framework" },
      { name: "TypeScript", category: "language" },
      { name: "Tailwind CSS", category: "css" },
      { name: "WhatsApp", category: "integration" },
      { name: "npm", category: "package_manager" },
    ],
    envVars: [],
    hasReadme: true,
    hasClaudeMd: true,
    documentationScore: 65,
    knownLimitations: "CLAUDE.md only contains an @AGENTS.md include, and AGENTS.md is generic Next.js boilerplate with no real project rules yet. Lead API only console.logs — nothing is delivered anywhere.",
    tasks: [
      "Wire the lead API up to a real CRM or mailbox — it currently only logs",
      "Replace the placeholder WhatsApp number",
      "Replace Unsplash placeholder photos before launch",
      "Set the real production domain and OG image",
    ],
  },
  {
    name: "Emlaq Homepage",
    description: "Brand homepage for EmlaQ Hollanda — orientation and multiple entry points, deliberately distinct from the Emlaq Landing page campaign site.",
    purpose: "General orientation site for Turkish-speaking home buyers, routing every CTA to the /alim-testi qualification form.",
    type: "website",
    status: "prototype",
    priority: "high",
    health: "needs_attention",
    local_path: `${HOME}/Documents/Projects/Emlaq Homepage`,
    tags: ["real-estate", "marketing", "turkish"],
    technologies: [
      { name: "Next.js", category: "framework" },
      { name: "React", category: "framework" },
      { name: "TypeScript", category: "language" },
      { name: "Tailwind CSS", category: "css" },
      { name: "WhatsApp", category: "integration" },
      { name: "npm", category: "package_manager" },
    ],
    envVars: [],
    hasReadme: true,
    hasClaudeMd: true,
    documentationScore: 65,
    knownLimitations: "Same lead-delivery gap as Emlaq Landing page — the /api/lead route only logs submissions. Legal entity name (EmlaQ Hollanda B.V. vs Evim Makelaars B.V.) still unresolved per its own README.",
    tasks: [
      "Wire the lead API up to a real CRM or mailbox",
      "Replace the placeholder WhatsApp/phone numbers",
      "Resolve the legal entity name question flagged in the README",
    ],
  },
  {
    name: "Pezeshkyar",
    description: "پزشک‌یار — an Iran-focused, Farsi/RTL online doctor-appointment booking platform with phone/OTP auth and deposit payments.",
    purpose: "Patients book doctor appointments on a Jalali calendar, pay a deposit via Zarinpal, and chat with the doctor per appointment.",
    type: "saas",
    status: "development",
    priority: "high",
    health: "needs_attention",
    local_path: `${HOME}/Documents/Personal/DocApp`,
    tags: ["persian", "healthcare", "booking"],
    technologies: [
      { name: "Next.js", category: "framework" },
      { name: "React", category: "framework" },
      { name: "TypeScript", category: "language" },
      { name: "Tailwind CSS", category: "css" },
      { name: "Prisma", category: "database" },
      { name: "PostgreSQL", category: "database" },
      { name: "Redis", category: "database" },
      { name: "JWT (jose)", category: "auth" },
      { name: "bcrypt", category: "auth" },
      { name: "Zarinpal", category: "service" },
      { name: "Kavenegar", category: "service" },
      { name: "npm", category: "package_manager" },
    ],
    envVars: [
      { name: "DATABASE_URL", status: "unknown" },
      { name: "REDIS_URL", status: "unknown" },
      { name: "AUTH_JWT_SECRET", status: "unknown" },
      { name: "PII_ENCRYPTION_KEY", status: "unknown" },
      { name: "KAVENEGAR_API_KEY", status: "unknown" },
      { name: "ZARINPAL_MERCHANT_ID", status: "unknown" },
      { name: "S3_ACCESS_KEY", status: "unknown" },
      { name: "S3_SECRET_KEY", status: "unknown" },
      { name: "NEXT_PUBLIC_APP_URL", status: "unknown", is_public: true },
    ],
    hasReadme: true,
    hasClaudeMd: true,
    documentationScore: 75,
    knownLimitations:
      "Git repo exists but only has the original create-next-app scaffold commit — the entire real application (all routes, components, Prisma schema, Docker config) is uncommitted in the working tree. S3 storage driver not implemented yet. No admin UI despite the schema supporting it.",
    tasks: ["Commit the entire application — it is currently all uncommitted working-tree changes", "Implement the S3 storage driver", "Build the admin UI"],
  },
  {
    name: "Axioma Studio",
    description: "Personal portfolio/studio website with a self-hosted admin CMS backed by local SQLite.",
    purpose: "Public marketing site (home, works, studio, FAQ, notes, contact) plus a login-protected admin panel for managing content.",
    type: "website",
    status: "development",
    priority: "low",
    health: "needs_attention",
    local_path: `${HOME}/Documents/Personal/Website`,
    tags: ["portfolio", "personal"],
    technologies: [
      { name: "Next.js", category: "framework" },
      { name: "React", category: "framework" },
      { name: "TypeScript", category: "language" },
      { name: "Tailwind CSS", category: "css" },
      { name: "SQLite", category: "database" },
      { name: "JWT (jose)", category: "auth" },
      { name: "npm", category: "package_manager" },
    ],
    envVars: [],
    hasReadme: false,
    hasClaudeMd: false,
    documentationScore: 0,
    knownLimitations: "No README, no CLAUDE.md, no git repository. Its own .gitignore notes the SQLite file \"contains real content + admin credentials — never commit.\"",
    tasks: ["Write a README", "Initialize a git repository (carefully — the SQLite DB holds real admin credentials and must stay ignored)"],
  },
  {
    name: "Dinosaur Documentary",
    description: "A vertical-format (1080x1920) Remotion video documentary about meat-eating dinosaurs, with a Persian localization helper.",
    purpose: "Hook → intro → five dinosaur profile scenes (T-Rex, Velociraptor, Allosaurus, Spinosaurus, Giganotosaurus) → outro, with paper-texture/film-grain styling.",
    type: "other",
    status: "prototype",
    priority: "low",
    health: "needs_attention",
    local_path: `${HOME}/my-video`,
    tags: ["video", "remotion", "creative"],
    technologies: [
      { name: "Remotion", category: "framework" },
      { name: "React", category: "framework" },
      { name: "TypeScript", category: "language" },
      { name: "Tailwind CSS", category: "css" },
      { name: "npm", category: "package_manager" },
    ],
    envVars: [],
    hasReadme: true,
    hasClaudeMd: false,
    documentationScore: 40,
    knownLimitations: "Git repo has only the initial scaffold commit — the entire dinosaur documentary content (scenes, data, assets) is uncommitted.",
    tasks: ["Commit the DinoDocumentary scenes and public assets"],
  },
];

function run() {
  let created = 0;
  let skipped = 0;

  for (const seed of PROJECTS) {
    const existing = db.prepare(`SELECT id FROM projects WHERE local_path = ?`).get(seed.local_path) as { id: number } | undefined;
    if (existing) {
      skipped += 1;
      continue;
    }

    let slug = slugify(seed.name);
    if (getProjectBySlug(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const project = createProject({
      slug,
      name: seed.name,
      description: seed.description,
      purpose: seed.purpose,
      type: seed.type,
      status: seed.status,
      priority: seed.priority,
      health: seed.health,
      local_path: seed.local_path,
      git_remote_url: seed.git_remote_url ?? null,
      notes: seed.notes,
    });

    setProjectTags(project.id, seed.tags);
    setProjectTechnologies(project.id, seed.technologies);
    setProjectEnvVars(project.id, seed.envVars);
    upsertClaudeKnowledge(project.id, {
      has_readme: seed.hasReadme ? 1 : 0,
      has_claude_md: seed.hasClaudeMd ? 1 : 0,
      documentation_score: seed.documentationScore,
      known_limitations: seed.knownLimitations ?? null,
      do_not_change: seed.doNotChange ?? null,
    });
    for (const title of seed.tasks ?? []) {
      createTask({ project_id: project.id, title, status: "todo" });
    }

    created += 1;
  }

  console.log(`Seed complete: ${created} project(s) created, ${skipped} already present.`);
}

run();
