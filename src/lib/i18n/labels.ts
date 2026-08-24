import type { BugSeverity, Health, Priority, ProjectStatus, ProjectType, TaskStatus } from "@/lib/types";
import type { Locale } from "./dictionaries";

const HEALTH: Record<Locale, Record<Health, string>> = {
  en: { healthy: "Healthy", needs_attention: "Needs attention", broken: "Broken", archived: "Archived", unknown: "Unknown" },
  fa: { healthy: "سالم", needs_attention: "نیاز به توجه", broken: "خراب", archived: "بایگانی‌شده", unknown: "نامشخص" },
  nl: { healthy: "Gezond", needs_attention: "Aandacht nodig", broken: "Kapot", archived: "Gearchiveerd", unknown: "Onbekend" },
};

const STATUS: Record<Locale, Record<ProjectStatus, string>> = {
  en: {
    idea: "Idea",
    prototype: "Prototype",
    development: "Development",
    active: "Active",
    production: "Production",
    paused: "Paused",
    completed: "Completed",
    archived: "Archived",
  },
  fa: {
    idea: "ایده",
    prototype: "پروتوتایپ",
    development: "در حال توسعه",
    active: "فعال",
    production: "تولید",
    paused: "متوقف‌شده",
    completed: "تکمیل‌شده",
    archived: "بایگانی‌شده",
  },
  nl: {
    idea: "Idee",
    prototype: "Prototype",
    development: "In ontwikkeling",
    active: "Actief",
    production: "Productie",
    paused: "Gepauzeerd",
    completed: "Voltooid",
    archived: "Gearchiveerd",
  },
};

const TYPE: Record<Locale, Record<ProjectType, string>> = {
  en: {
    web_app: "Web app",
    website: "Website",
    saas: "SaaS",
    automation: "Automation",
    ai_tool: "AI tool",
    mobile_app: "Mobile app",
    desktop_app: "Desktop app",
    api: "API",
    experiment: "Experiment",
    internal_tool: "Internal tool",
    other: "Other",
  },
  fa: {
    web_app: "اپ وب",
    website: "وب‌سایت",
    saas: "SaaS",
    automation: "اتوماسیون",
    ai_tool: "ابزار هوش مصنوعی",
    mobile_app: "اپ موبایل",
    desktop_app: "اپ دسکتاپ",
    api: "API",
    experiment: "آزمایشی",
    internal_tool: "ابزار داخلی",
    other: "سایر",
  },
  nl: {
    web_app: "Webapp",
    website: "Website",
    saas: "SaaS",
    automation: "Automatisering",
    ai_tool: "AI-tool",
    mobile_app: "Mobiele app",
    desktop_app: "Desktopapp",
    api: "API",
    experiment: "Experiment",
    internal_tool: "Intern hulpmiddel",
    other: "Overig",
  },
};

const PRIORITY: Record<Locale, Record<Priority, string>> = {
  en: { low: "Low", medium: "Medium", high: "High", critical: "Critical" },
  fa: { low: "کم", medium: "متوسط", high: "بالا", critical: "بحرانی" },
  nl: { low: "Laag", medium: "Gemiddeld", high: "Hoog", critical: "Kritiek" },
};

const SEVERITY: Record<Locale, Record<BugSeverity, string>> = {
  en: { low: "Low", medium: "Medium", high: "High", critical: "Critical" },
  fa: { low: "کم", medium: "متوسط", high: "بالا", critical: "بحرانی" },
  nl: { low: "Laag", medium: "Gemiddeld", high: "Hoog", critical: "Kritiek" },
};

const TASK_STATUS: Record<Locale, Record<TaskStatus, string>> = {
  en: { backlog: "Backlog", todo: "Todo", in_progress: "In Progress", blocked: "Blocked", review: "Review", done: "Done" },
  fa: { backlog: "بک‌لاگ", todo: "برای انجام", in_progress: "در حال انجام", blocked: "مسدود", review: "بازبینی", done: "انجام‌شده" },
  nl: { backlog: "Backlog", todo: "Te doen", in_progress: "In uitvoering", blocked: "Geblokkeerd", review: "Beoordeling", done: "Klaar" },
};

export const healthLabel = (value: Health, locale: Locale = "en") => HEALTH[locale][value] ?? HEALTH.en[value] ?? value;
export const statusLabel = (value: ProjectStatus, locale: Locale = "en") => STATUS[locale][value] ?? STATUS.en[value] ?? value;
export const typeLabel = (value: ProjectType, locale: Locale = "en") => TYPE[locale][value] ?? TYPE.en[value] ?? value;
export const priorityLabel = (value: Priority, locale: Locale = "en") => PRIORITY[locale][value] ?? PRIORITY.en[value] ?? value;
export const severityLabel = (value: BugSeverity, locale: Locale = "en") => SEVERITY[locale][value] ?? SEVERITY.en[value] ?? value;
export const taskStatusLabel = (value: TaskStatus, locale: Locale = "en") => TASK_STATUS[locale][value] ?? TASK_STATUS.en[value] ?? value;
