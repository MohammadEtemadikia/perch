"use client";

import { useEffect, useState } from "react";
import { FolderOpen, Terminal, GitBranch, Play, ExternalLink } from "lucide-react";
import { useToast } from "./Toast";

declare global {
  interface Window {
    perch?: {
      isElectron: boolean;
      pickFolder: (defaultPath?: string) => Promise<{ ok: boolean; canceled?: boolean; path?: string }>;
      openPath: (path: string) => Promise<{ ok: boolean; reason?: string }>;
      openExternal: (url: string) => Promise<{ ok: boolean; reason?: string }>;
      openTerminal: (path: string) => Promise<{ ok: boolean; reason?: string }>;
      runCommand: (path: string, command: string) => Promise<{ ok: boolean; reason?: string }>;
    };
  }
}

export function useElectron() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(typeof window !== "undefined" && Boolean(window.perch?.isElectron));
  }, []);
  return available;
}

function ActionButton({
  icon: Icon,
  label,
  disabled,
  disabledReason,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
      className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-40"
      style={{ borderColor: "var(--border-strong)" }}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

export function ProjectActionButtons({ localPath, gitRemoteUrl, runCommand }: { localPath: string | null; gitRemoteUrl: string | null; runCommand: string | null }) {
  const isElectron = useElectron();
  const toast = useToast();

  async function run(fn: () => Promise<{ ok: boolean; reason?: string }> | undefined, successMsg: string) {
    if (!fn) return;
    const result = await fn();
    if (result?.ok) toast.push(successMsg, "success");
    else toast.push(result?.reason ?? "That action is not available.", "error");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ActionButton
        icon={FolderOpen}
        label="Open Folder"
        disabled={!isElectron || !localPath}
        disabledReason={!isElectron ? "Only available in the desktop app." : "No local path set."}
        onClick={() => run(() => window.perch!.openPath(localPath!), "Opened in Finder")}
      />
      <ActionButton
        icon={Terminal}
        label="Open Terminal"
        disabled={!isElectron || !localPath}
        disabledReason={!isElectron ? "Only available in the desktop app." : "No local path set."}
        onClick={() => run(() => window.perch!.openTerminal(localPath!), "Opened Terminal")}
      />
      <ActionButton
        icon={GitBranch}
        label="Open Git Repository"
        disabled={!gitRemoteUrl}
        disabledReason="No git remote configured."
        onClick={() =>
          run(() => (isElectron ? window.perch!.openExternal(toHttpsUrl(gitRemoteUrl!)) : (window.open(toHttpsUrl(gitRemoteUrl!), "_blank"), Promise.resolve({ ok: true }))), "Opened repository")
        }
      />
      <ActionButton
        icon={Play}
        label="Run Project"
        disabled={!isElectron || !localPath || !runCommand}
        disabledReason={!isElectron ? "Only available in the desktop app." : !runCommand ? "No dev/start script detected." : "No local path set."}
        onClick={() => run(() => window.perch!.runCommand(localPath!, runCommand!), `Running "${runCommand}"`)}
      />
    </div>
  );
}

export function ExternalLinkButton({ url, label }: { url: string; label: string }) {
  const isElectron = useElectron();
  const toast = useToast();
  return (
    <button
      onClick={async () => {
        if (isElectron) {
          const result = await window.perch!.openExternal(url);
          if (!result.ok) toast.push(result.reason ?? "Could not open link.", "error");
        } else {
          window.open(url, "_blank");
        }
      }}
      className="flex items-center gap-1 text-[12px]"
      style={{ color: "var(--accent)" }}
    >
      <ExternalLink size={12} /> {label}
    </button>
  );
}

function toHttpsUrl(url: string): string {
  if (url.startsWith("git@")) {
    const match = /git@([^:]+):(.+?)(\.git)?$/.exec(url);
    if (match) return `https://${match[1]}/${match[2]}`;
  }
  return url.replace(/\.git$/, "");
}
