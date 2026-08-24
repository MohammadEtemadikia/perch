"use client";

import { useState } from "react";
import { Lock, ShieldOff } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

const inputStyle = { background: "var(--bg-inset)", borderColor: "var(--border)" };

export function AuthGate({ mode }: { mode: "setup" | "login" }) {
  const { t } = useT();
  return (
    <div className="flex h-screen w-screen items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm rounded-xl border p-6" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)", boxShadow: "var(--shadow)" }}>
        <div className="mb-4 text-center">
          <div className="text-[16px] font-semibold tracking-tight">Perch</div>
          <div className="mt-1 text-[12.5px]" style={{ color: "var(--text-muted)" }}>
            {mode === "setup" ? t("auth.setupSubtitle") : t("auth.loginSubtitle")}
          </div>
        </div>
        {mode === "setup" ? <SetupForm /> : <LoginForm />}
      </div>
    </div>
  );
}

function reloadApp() {
  window.location.href = "/";
}

function SetupForm() {
  const { t } = useT();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function setupWith(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("auth.errGeneric"));
        setBusy(false);
        return;
      }
      reloadApp();
    } catch {
      setError(t("auth.errUnreachable"));
      setBusy(false);
    }
  }

  function submitPassword() {
    if (password.length < 4) {
      setError(t("auth.errMinLength"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.errMismatch"));
      return;
    }
    setupWith({ method: "password", password });
  }

  return (
    <div className="space-y-3">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("auth.choosePassword")}
        className="w-full rounded-md border px-2.5 py-1.5 text-[13px]"
        style={inputStyle}
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder={t("auth.confirmPassword")}
        onKeyDown={(e) => e.key === "Enter" && submitPassword()}
        className="w-full rounded-md border px-2.5 py-1.5 text-[13px]"
        style={inputStyle}
      />
      {error && (
        <div className="text-[12px]" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      )}
      <button
        onClick={submitPassword}
        disabled={busy}
        className="flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50"
        style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
      >
        <Lock size={13} /> {t("auth.setPasswordAndContinue")}
      </button>
      <div className="flex items-center gap-2 py-1">
        <div className="h-px flex-1" style={{ background: "var(--border)" }} />
        <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
          {t("auth.or")}
        </span>
        <div className="h-px flex-1" style={{ background: "var(--border)" }} />
      </div>
      <button
        onClick={() => setupWith({ method: "none" })}
        disabled={busy}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50"
        style={{ borderColor: "var(--border-strong)" }}
      >
        <ShieldOff size={13} /> {t("auth.skip")}
      </button>
      <p className="text-center text-[11px]" style={{ color: "var(--text-faint)" }}>
        {t("auth.skipHint")}
      </p>
    </div>
  );
}

function LoginForm() {
  const { t } = useT();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!password) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("auth.errIncorrect"));
        setBusy(false);
        return;
      }
      reloadApp();
    } catch {
      setError(t("auth.errUnreachable"));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={t("auth.passwordPlaceholder")}
        className="w-full rounded-md border px-2.5 py-1.5 text-[13px]"
        style={inputStyle}
      />
      {error && (
        <div className="text-[12px]" style={{ color: "var(--danger)" }}>
          {error}
        </div>
      )}
      <button
        onClick={submit}
        disabled={busy || !password}
        className="flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50"
        style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
      >
        <Lock size={13} /> {t("auth.unlock")}
      </button>
    </div>
  );
}
