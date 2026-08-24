"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Bug,
  BookOpen,
  Boxes,
  Plug,
  GitBranch,
  FolderTree,
  Network,
  Settings,
  Moon,
  Sun,
  Command,
} from "lucide-react";
import { useT } from "@/lib/i18n/provider";

const NAV = [
  { href: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { href: "/projects", key: "nav.projects", icon: FolderKanban },
  { href: "/tasks", key: "nav.tasks", icon: ListChecks },
  { href: "/bugs", key: "nav.bugs", icon: Bug },
  { href: "/documentation", key: "nav.documentation", icon: BookOpen },
  { href: "/technologies", key: "nav.technologies", icon: Boxes },
  { href: "/integrations", key: "nav.integrations", icon: Plug },
  { href: "/git", key: "nav.git", icon: GitBranch },
  { href: "/organization", key: "nav.organization", icon: FolderTree },
  { href: "/system-map", key: "nav.systemMap", icon: Network },
  { href: "/settings", key: "nav.settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useT();
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("perch-theme") as "light" | "dark" | null;
    setTheme(stored);
  }, []);

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.getAttribute("data-theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("perch-theme", next);
    setTheme(next);
  }

  return (
    <aside
      className="flex h-full w-[228px] shrink-0 flex-col border-r px-2.5 py-3"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2 px-2 py-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny local icon, not worth next/image overhead here */}
        <img src="/icon.png" alt="" width={32} height={32} className="rounded-md" />
        <span className="text-[13px] font-semibold tracking-tight">Perch</span>
      </div>

      <button
        onClick={() => window.dispatchEvent(new CustomEvent("perch:open-palette"))}
        className="mx-1 mt-3 flex items-center justify-between rounded-md border px-2.5 py-1.5 text-[12px]"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        <span className="flex items-center gap-1.5">
          <Command size={13} /> {t("nav.searchCommands")}
        </span>
        <kbd
          className="rounded border px-1 py-0.5 text-[10px]"
          style={{ borderColor: "var(--border-strong)", color: "var(--text-faint)" }}
        >
          ⌘K
        </kbd>
      </button>

      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] transition-colors"
              style={{
                background: active ? "var(--bg-inset)" : "transparent",
                color: active ? "var(--text)" : "var(--text-muted)",
                fontWeight: active ? 600 : 500,
              }}
            >
              <Icon size={15} strokeWidth={2} />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggleTheme}
        className="flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[12.5px]"
        style={{ color: "var(--text-muted)" }}
      >
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        {theme === "dark" ? t("nav.lightMode") : t("nav.darkMode")}
      </button>
    </aside>
  );
}
