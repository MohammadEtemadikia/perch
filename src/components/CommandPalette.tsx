"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { SearchResult } from "@/lib/queries";
import { useT } from "@/lib/i18n/provider";

const STATIC_COMMANDS: { titleKey: string; subtitleKey: string; href: string }[] = [
  { titleKey: "palette.cmd.dashboard.title", subtitleKey: "palette.cmd.dashboard.subtitle", href: "/dashboard" },
  { titleKey: "palette.cmd.projects.title", subtitleKey: "palette.cmd.projects.subtitle", href: "/projects" },
  { titleKey: "palette.cmd.newProject.title", subtitleKey: "palette.cmd.newProject.subtitle", href: "/projects?new=1" },
  { titleKey: "palette.cmd.import.title", subtitleKey: "palette.cmd.import.subtitle", href: "/projects?import=1" },
  { titleKey: "palette.cmd.tasks.title", subtitleKey: "palette.cmd.tasks.subtitle", href: "/tasks" },
  { titleKey: "palette.cmd.bugs.title", subtitleKey: "palette.cmd.bugs.subtitle", href: "/bugs" },
  { titleKey: "palette.cmd.documentation.title", subtitleKey: "palette.cmd.documentation.subtitle", href: "/documentation" },
  { titleKey: "palette.cmd.git.title", subtitleKey: "palette.cmd.git.subtitle", href: "/git" },
  { titleKey: "palette.cmd.systemMap.title", subtitleKey: "palette.cmd.systemMap.subtitle", href: "/system-map" },
  { titleKey: "palette.cmd.organization.title", subtitleKey: "palette.cmd.organization.subtitle", href: "/organization" },
  { titleKey: "palette.cmd.settings.title", subtitleKey: "palette.cmd.settings.subtitle", href: "/settings" },
];

export function CommandPalette() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onCustom() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeydown);
    window.addEventListener("perch:open-palette", onCustom);
    return () => {
      window.removeEventListener("keydown", onKeydown);
      window.removeEventListener("perch:open-palette", onCustom);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
    else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) setResults(await res.json());
      } catch {
        /* search is best-effort */
      }
    }, 150);
    return () => clearTimeout(handle);
  }, [query]);

  if (!open) return null;

  const filteredCommands = STATIC_COMMANDS.filter((c) =>
    t(c.titleKey).toLowerCase().includes(query.toLowerCase())
  );

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[14vh]"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-[560px] overflow-hidden rounded-xl border"
        style={{ background: "var(--bg-elevated)", borderColor: "var(--border-strong)", boxShadow: "var(--shadow)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-3.5 py-3" style={{ borderColor: "var(--border)" }}>
          <Search size={15} style={{ color: "var(--text-faint)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("palette.searchPlaceholder")}
            className="w-full bg-transparent text-[13.5px] outline-none"
          />
        </div>
        <div className="max-h-[360px] overflow-y-auto py-1.5">
          {query.trim() && results.length > 0 && (
            <div>
              <div className="px-3.5 pt-1.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                {t("palette.results")}
              </div>
              {results.map((r) => (
                <button
                  key={`${r.kind}-${r.id}`}
                  onClick={() => go(r.href)}
                  className="flex w-full flex-col items-start px-3.5 py-2 text-left hover:brightness-95"
                  style={{ background: "transparent" }}
                >
                  <span className="text-[13px]">{r.title}</span>
                  <span className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
                    {r.kind} · {r.subtitle}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div>
            <div className="px-3.5 pt-1.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
              {t("palette.commands")}
            </div>
            {filteredCommands.length === 0 && (
              <div className="px-3.5 py-3 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
                {t("palette.noMatch")}
              </div>
            )}
            {filteredCommands.map((c) => (
              <button
                key={c.href}
                onClick={() => go(c.href)}
                className="flex w-full flex-col items-start px-3.5 py-2 text-left hover:brightness-95"
              >
                <span className="text-[13px]">{t(c.titleKey)}</span>
                <span className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
                  {t(c.subtitleKey)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
