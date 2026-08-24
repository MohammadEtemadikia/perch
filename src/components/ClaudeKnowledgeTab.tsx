"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ClaudeKnowledge } from "@/lib/types";
import type { ProjectExplanation } from "@/lib/explainer";
import { useToast } from "./Toast";
import { Sparkles } from "lucide-react";

const fieldStyle = { background: "var(--bg-inset)", borderColor: "var(--border)" };

export function ClaudeKnowledgeTab({ projectId, knowledge }: { projectId: number; knowledge: ClaudeKnowledge | null }) {
  const [architectureNotes, setArchitectureNotes] = useState(knowledge?.architecture_notes ?? "");
  const [devRules, setDevRules] = useState(knowledge?.dev_rules ?? "");
  const [knownLimitations, setKnownLimitations] = useState(knowledge?.known_limitations ?? "");
  const [importantDecisions, setImportantDecisions] = useState(knowledge?.important_decisions ?? "");
  const [doNotChange, setDoNotChange] = useState(knowledge?.do_not_change ?? "");
  const [checkBefore, setCheckBefore] = useState(knowledge?.check_before_modifying ?? "");
  const [saving, setSaving] = useState(false);
  const [explanation, setExplanation] = useState<ProjectExplanation | null>(null);
  const [explaining, setExplaining] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/docs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          architecture_notes: architectureNotes,
          dev_rules: devRules,
          known_limitations: knownLimitations,
          important_decisions: importantDecisions,
          do_not_change: doNotChange,
          check_before_modifying: checkBefore,
        }),
      });
      toast.push("Saved.", "success");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function explain() {
    setExplaining(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/explain`);
      setExplanation(await res.json());
    } finally {
      setExplaining(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[12.5px] font-semibold">Notes for Claude</div>
          <button onClick={save} disabled={saving} className="rounded-md px-2.5 py-1 text-[11.5px] font-medium disabled:opacity-50" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        <TextField label="Architecture notes" value={architectureNotes} onChange={setArchitectureNotes} />
        <TextField label="Development rules" value={devRules} onChange={setDevRules} />
        <TextField label="Known limitations" value={knownLimitations} onChange={setKnownLimitations} />
        <TextField label="Important decisions" value={importantDecisions} onChange={setImportantDecisions} />
        <TextField label="Things Claude must NOT change" value={doNotChange} onChange={setDoNotChange} />
        <TextField label="Check before modifying" value={checkBefore} onChange={setCheckBefore} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <div className="text-[12.5px] font-semibold">Explain This Project</div>
          <button onClick={explain} disabled={explaining} className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11.5px] font-medium" style={{ borderColor: "var(--border-strong)" }}>
            <Sparkles size={12} /> {explaining ? "Generating…" : "Generate"}
          </button>
        </div>
        {!explanation ? (
          <p className="mt-3 text-[12px]" style={{ color: "var(--text-faint)" }}>
            Produces a plain-language read-out from what's actually on file — not an AI guess — for anyone who isn't a developer.
          </p>
        ) : (
          <div className="mt-3 space-y-3 text-[12.5px]">
            <ExplainSection title="What does this project actually do?" text={explanation.whatItDoes} />
            <ExplainSection title="What happens when a user opens it?" text={explanation.whenUserOpensIt} />
            <ExplainList title="Main components" items={explanation.mainComponents} />
            <ExplainList title="External services used" items={explanation.externalServices} />
            <ExplainList title="What's unfinished" items={explanation.whatIsUnfinished} />
            <ExplainList title="What could break" items={explanation.whatCouldBreak} />
            <ExplainList title="Before asking Claude to modify it" items={explanation.beforeAskingClaude} />
          </div>
        )}
      </div>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="w-full rounded-md border px-2.5 py-1.5 text-[12.5px]" style={fieldStyle} />
    </label>
  );
}

function ExplainSection({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
        {title}
      </div>
      <p className="mt-0.5">{text}</p>
    </div>
  );
}

function ExplainList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
        {title}
      </div>
      <ul className="mt-0.5 list-inside list-disc space-y-0.5">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
