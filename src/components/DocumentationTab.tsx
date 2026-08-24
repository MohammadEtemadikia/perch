"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import { CheckCircle2, XCircle, FileText } from "lucide-react";

interface DocStatus {
  name: string;
  exists: boolean;
}

interface Preview {
  name: string;
  path: string;
  exists: boolean;
  currentContent: string | null;
  proposedContent: string;
  unchanged: boolean;
}

export function DocumentationTab({ projectId, documentationScore }: { projectId: number; documentationScore: number | null }) {
  const [docs, setDocs] = useState<DocStatus[]>([]);
  const [hasLocalPath, setHasLocalPath] = useState(false);
  const [previews, setPreviews] = useState<Preview[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [writing, setWriting] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  const loadStatus = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/docs`);
    if (!res.ok) return;
    const data = await res.json();
    setDocs(data.docs);
    setHasLocalPath(data.hasLocalPath);
  }, [projectId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/docs/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docs: docs.map((d) => d.name) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error ?? "Could not generate documentation.", "error");
        return;
      }
      setPreviews(data.previews);
    } finally {
      setLoading(false);
    }
  }

  async function write(preview: Preview, overwrite: boolean) {
    setWriting(preview.name);
    try {
      const res = await fetch(`/api/projects/${projectId}/docs/write`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: preview.name, content: preview.proposedContent, overwrite }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error ?? "Could not write file.", "error");
        return;
      }
      toast.push(`${data.action === "created" ? "Created" : "Updated"} ${preview.name}`, "success");
      setPreviews((prev) => prev?.filter((p) => p.name !== preview.name) ?? null);
      loadStatus();
      router.refresh();
    } finally {
      setWriting(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12.5px] font-semibold">Documentation status</div>
          <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
            Completeness score: {documentationScore ?? "not scanned yet"}
            {documentationScore !== null ? "%" : ""}
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading || !hasLocalPath}
          title={!hasLocalPath ? "This project has no local path set." : undefined}
          className="rounded-md px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          {loading ? "Analyzing…" : "Generate Project Documentation"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {docs.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px]" style={{ borderColor: "var(--border)" }}>
            {d.exists ? <CheckCircle2 size={13} style={{ color: "var(--success)" }} /> : <XCircle size={13} style={{ color: "var(--text-faint)" }} />}
            <FileText size={12} style={{ color: "var(--text-faint)" }} />
            {d.name}
          </div>
        ))}
      </div>

      {previews && (
        <div className="mt-5 space-y-4">
          {previews.map((p) => (
            <div key={p.name} className="rounded-lg border" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: "var(--border)" }}>
                <div className="text-[12.5px] font-semibold">{p.name}</div>
                <div className="flex items-center gap-2">
                  {p.unchanged ? (
                    <span className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
                      No changes
                    </span>
                  ) : (
                    <button
                      onClick={() => write(p, p.exists)}
                      disabled={writing === p.name}
                      className="rounded-md px-2.5 py-1 text-[11.5px] font-medium disabled:opacity-50"
                      style={{ background: p.exists ? "var(--warning)" : "var(--accent)", color: "var(--accent-fg)" }}
                    >
                      {writing === p.name ? "Writing…" : p.exists ? "Overwrite existing file" : "Create file"}
                    </button>
                  )}
                </div>
              </div>
              {p.exists && !p.unchanged && (
                <div className="border-b px-3 py-1.5 text-[11px]" style={{ borderColor: "var(--border)", color: "var(--warning)" }}>
                  A file already exists at this path — review the diff below before overwriting it.
                </div>
              )}
              {!p.unchanged && (
                <div className="grid grid-cols-2 divide-x text-[11px]" style={{ borderColor: "var(--border)" }}>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap p-3 font-mono" style={{ color: "var(--text-faint)" }}>
                    {p.currentContent ?? "(file does not exist yet)"}
                  </pre>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap p-3 font-mono">{p.proposedContent}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
