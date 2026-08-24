"use client";

import { useState } from "react";
import { Lock, ShieldOff } from "lucide-react";
import { useToast } from "./Toast";
import { ConfirmDialog } from "./Modal";
import { useT } from "@/lib/i18n/provider";
import type { AuthMethod } from "@/lib/auth";

const inputStyle = { background: "var(--bg-inset)", borderColor: "var(--border)" };

export function AuthSettings({ authMethod }: { authMethod: AuthMethod }) {
  const { t } = useT();
  const [method, setMethod] = useState(authMethod);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const toast = useToast();

  async function submit(body: Record<string, unknown>): Promise<boolean> {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error ?? t("settings.updateError"), "error");
        return false;
      }
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function setOrChangePassword() {
    if (newPassword.length < 4) {
      toast.push(t("auth.errMinLength"), "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.push(t("auth.errMismatch"), "error");
      return;
    }
    const ok = await submit({ currentPassword: method === "password" ? currentPassword : undefined, newPassword });
    if (ok) {
      toast.push(method === "password" ? t("settings.passwordChanged") : t("settings.passwordSet"), "success");
      setMethod("password");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  async function removePassword() {
    const ok = await submit({ currentPassword, newPassword: null });
    setConfirmingRemove(false);
    if (ok) {
      toast.push(t("settings.passwordRemoved"), "success");
      setMethod("none");
      setCurrentPassword("");
    }
  }

  return (
    <section>
      <h2 className="text-[13px] font-semibold">{t("settings.securityTitle")}</h2>
      <p className="mt-1 text-[12px]" style={{ color: "var(--text-muted)" }}>
        {method === "password" ? t("settings.securityOn") : t("settings.securityOff")}
      </p>

      <div className="mt-3 max-w-sm space-y-2">
        {method === "password" && (
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t("settings.currentPassword")}
            className="w-full rounded-md border px-2.5 py-1.5 text-[13px]"
            style={inputStyle}
          />
        )}
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={method === "password" ? t("settings.newPassword") : t("settings.choosePassword")}
          className="w-full rounded-md border px-2.5 py-1.5 text-[13px]"
          style={inputStyle}
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t("settings.confirmPassword")}
          onKeyDown={(e) => e.key === "Enter" && setOrChangePassword()}
          className="w-full rounded-md border px-2.5 py-1.5 text-[13px]"
          style={inputStyle}
        />
        <div className="flex gap-2">
          <button
            onClick={setOrChangePassword}
            disabled={saving || !newPassword}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            <Lock size={13} /> {method === "password" ? t("settings.changePassword") : t("settings.setPassword")}
          </button>
          {method === "password" && (
            <button
              onClick={() => setConfirmingRemove(true)}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12.5px] font-medium"
              style={{ borderColor: "var(--border-strong)", color: "var(--danger)" }}
            >
              <ShieldOff size={13} /> {t("settings.removePassword")}
            </button>
          )}
        </div>
      </div>

      {confirmingRemove && (
        <ConfirmDialog
          title={t("settings.removeConfirmTitle")}
          message={t("settings.removeConfirmMessage")}
          confirmLabel={t("settings.remove")}
          danger
          onConfirm={removePassword}
          onCancel={() => setConfirmingRemove(false)}
        />
      )}
    </section>
  );
}
