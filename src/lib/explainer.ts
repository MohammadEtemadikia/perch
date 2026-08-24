import type { Project } from "./types";
import { getClaudeKnowledge, listProjectBugs, listProjectTasks } from "./queries";
import type { GitInfo } from "./git";

export interface ProjectExplanation {
  whatItDoes: string;
  whenUserOpensIt: string;
  mainComponents: string[];
  externalServices: string[];
  whatIsUnfinished: string[];
  whatCouldBreak: string[];
  beforeAskingClaude: string[];
}

/**
 * Composes a plain-language explanation entirely from data already recorded
 * about the project (description, tech, tasks, bugs, git state). This is not
 * an AI-generated summary — no model call is made — it's a deterministic
 * readout of what's actually on file, worded for a non-technical reader.
 */
export function explainProject(
  project: Project,
  technologies: { name: string; category: string }[],
  git: GitInfo
): ProjectExplanation {
  const knowledge = getClaudeKnowledge(project.id);
  const openTasks = listProjectTasks(project.id).filter((t) => t.status !== "done");
  const openBugs = listProjectBugs(project.id).filter((b) => b.status === "open" || b.status === "in_progress");

  const frameworks = technologies.filter((t) => t.category === "framework").map((t) => t.name);
  const databases = technologies.filter((t) => t.category === "database").map((t) => t.name);
  const services = technologies.filter((t) => t.category === "service" || t.category === "integration").map((t) => t.name);
  const hosting = technologies.filter((t) => t.category === "hosting").map((t) => t.name);

  const whatItDoes =
    project.description ||
    project.purpose ||
    `No description has been recorded yet for "${project.name}" — add one in the project's Overview tab so this section can say something useful.`;

  const whenUserOpensIt = frameworks.length
    ? `This is a ${frameworks.join(" + ")} application${hosting.length ? `, currently set up to run on ${hosting.join(", ")}` : ""}. Beyond that, the exact first-load experience isn't recorded here — check the project's own README for a walkthrough.`
    : "How the app behaves when opened hasn't been recorded — check the project's README for details.";

  const mainComponents = technologies.filter((t) => t.category !== "service" && t.category !== "integration").map((t) => t.name);

  const externalServices = services.length ? services : ["None detected."];

  const whatIsUnfinished: string[] = [];
  if (openTasks.length) whatIsUnfinished.push(`${openTasks.length} open task${openTasks.length === 1 ? "" : "s"} recorded.`);
  if (knowledge?.known_limitations) whatIsUnfinished.push(knowledge.known_limitations);
  if (!whatIsUnfinished.length) whatIsUnfinished.push("Nothing specific recorded — this doesn't mean the project is complete, only that no gaps have been logged yet.");

  const whatCouldBreak: string[] = [];
  if (openBugs.length) whatCouldBreak.push(`${openBugs.length} open bug${openBugs.length === 1 ? "" : "s"} recorded — see the Bugs tab.`);
  if (git.isRepo && !git.isClean) whatCouldBreak.push("There are uncommitted changes in the working tree — anything not committed can be lost.");
  if (!git.isRepo) whatCouldBreak.push("This project has no git history at all — any mistake can't be rolled back.");
  if (!whatCouldBreak.length) whatCouldBreak.push("No specific risk areas recorded yet.");

  const beforeAskingClaude: string[] = [];
  if (knowledge?.do_not_change) beforeAskingClaude.push(`Do not change: ${knowledge.do_not_change}`);
  if (knowledge?.check_before_modifying) beforeAskingClaude.push(`Check first: ${knowledge.check_before_modifying}`);
  if (!knowledge?.has_claude_md) beforeAskingClaude.push("There is no CLAUDE.md in this project yet — generate one from the Documentation tab so a fresh Claude session has this context automatically.");
  if (databases.length) beforeAskingClaude.push(`Database: ${databases.join(", ")} — be careful with anything that touches migrations or seed data.`);
  if (!beforeAskingClaude.length) beforeAskingClaude.push("Nothing specific recorded.");

  return { whatItDoes, whenUserOpensIt, mainComponents, externalServices, whatIsUnfinished, whatCouldBreak, beforeAskingClaude };
}
