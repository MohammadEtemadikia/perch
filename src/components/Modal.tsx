"use client";

import { X } from "lucide-react";
import { useT } from "@/lib/i18n/provider";

export function Modal({
  title,
  onClose,
  children,
  width = 560,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto pt-[8vh] pb-10" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div
        className="w-full rounded-xl border"
        style={{ maxWidth: width, background: "var(--bg-elevated)", borderColor: "var(--border-strong)", boxShadow: "var(--shadow)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <div className="text-[13.5px] font-semibold">{title}</div>
          <button onClick={onClose} style={{ color: "var(--text-faint)" }}>
            <X size={16} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useT();
  return (
    <Modal title={title} onClose={onCancel} width={420}>
      <p className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
        {message}
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-md border px-3 py-1.5 text-[12.5px]" style={{ borderColor: "var(--border)" }}>
          {t("common.cancel")}
        </button>
        <button
          onClick={onConfirm}
          className="rounded-md px-3 py-1.5 text-[12.5px] font-medium"
          style={{ background: danger ? "var(--danger)" : "var(--accent)", color: "var(--accent-fg)" }}
        >
          {confirmLabel ?? t("common.confirm")}
        </button>
      </div>
    </Modal>
  );
}
