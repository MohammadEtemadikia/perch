"use client";

import { useState } from "react";
import { useToast } from "./Toast";
import { Plus, Trash2, Linkedin } from "lucide-react";
import { AuthSettings } from "./AuthSettings";
import type { AuthMethod } from "@/lib/auth";
import { useT } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/dictionaries";

const inputStyle = { background: "var(--bg-inset)", borderColor: "var(--border)" };

export function SettingsForm({
  scanRoots,
  organizationRoot,
  dbPath,
  authMethod,
}: {
  scanRoots: string[];
  organizationRoot: string;
  dbPath: string;
  authMethod: AuthMethod;
}) {
  const { t, locale, setLocale } = useT();
  const [roots, setRoots] = useState(scanRoots);
  const [newRoot, setNewRoot] = useState("");
  const [orgRoot, setOrgRoot] = useState(organizationRoot);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function save(next: { scanRoots?: string[]; organizationRoot?: string }) {
    setSaving(true);
    try {
      await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
      toast.push(t("common.saved"), "success");
    } finally {
      setSaving(false);
    }
  }

  function addRoot() {
    if (!newRoot.trim()) return;
    const next = [...roots, newRoot.trim()];
    setRoots(next);
    setNewRoot("");
    save({ scanRoots: next });
  }

  function removeRoot(root: string) {
    const next = roots.filter((r) => r !== root);
    setRoots(next);
    save({ scanRoots: next });
  }

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <section>
        <h2 className="text-[13px] font-semibold">{t("settings.scanRootsTitle")}</h2>
        <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
          {t("settings.scanRootsHint")}
        </p>
        <div className="mt-2 flex gap-2">
          <input value={newRoot} onChange={(e) => setNewRoot(e.target.value)} placeholder="/Users/you/Documents/Projects" className="flex-1 rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
          <button onClick={addRoot} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[12.5px] font-medium" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
            <Plus size={13} /> {t("tasks.add")}
          </button>
        </div>
        <div className="mt-2 space-y-1.5">
          {roots.map((r) => (
            <div key={r} className="flex items-center justify-between rounded-md border px-2.5 py-1.5 font-mono text-[12px]" style={{ borderColor: "var(--border)" }}>
              {r}
              <button onClick={() => removeRoot(r)} style={{ color: "var(--text-faint)" }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-semibold">{t("settings.orgRootTitle")}</h2>
        <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
          {t("settings.orgRootHint")}
        </p>
        <div className="mt-2 flex gap-2">
          <input value={orgRoot} onChange={(e) => setOrgRoot(e.target.value)} placeholder="/Users/you/Projects" className="flex-1 rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
          <button onClick={() => save({ organizationRoot: orgRoot })} disabled={saving} className="rounded-md px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
            {t("settings.save")}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-semibold">{t("settings.languageTitle")}</h2>
        <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
          {t("settings.languageHint")}
        </p>
        <div className="mt-2 flex gap-2">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="rounded-md border px-2.5 py-1.5 text-[13px]"
            style={inputStyle}
          >
            <option value="en">English</option>
            <option value="fa">فارسی</option>
            <option value="nl">Nederlands</option>
          </select>
        </div>
      </section>

      <section>
        <h2 className="text-[13px] font-semibold">{t("settings.databaseTitle")}</h2>
        <p className="mt-1 font-mono text-[12px]" style={{ color: "var(--text-faint)" }}>
          {dbPath}
        </p>
        <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
          {t("settings.databaseHint")}
        </p>
      </section>

      <AuthSettings authMethod={authMethod} />

      <section>
        <h2 className="text-[13px] font-semibold">{t("settings.creditsTitle")}</h2>
        <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
          {t("settings.creditsBuiltBy")} <span style={{ color: "var(--text)" }}>Mohammad Etemadikia</span> —{" "}
          <a href="mailto:etemadikia@technologist.com" style={{ color: "var(--accent)" }}>
            etemadikia@technologist.com
          </a>
        </p>
        <p className="mt-1.5 flex items-center gap-1 text-[12px]">
          <Linkedin size={13} style={{ color: "var(--text-faint)" }} />
          <a href="https://www.linkedin.com/in/etemadikia/" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
            linkedin.com/in/etemadikia
          </a>
        </p>
        <p className="mt-1.5 text-[11.5px]" style={{ color: "var(--text-faint)" }}>
          {t("settings.creditsCopyright", { year: new Date().getFullYear() })}
        </p>
      </section>
    </div>
  );
}
