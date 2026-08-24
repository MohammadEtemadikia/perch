import crypto from "crypto";
import { getSetting, setSetting } from "./queries";

export const SESSION_COOKIE_NAME = "perch_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type AuthMethod = "password" | "none";

function getOrCreateSessionSecret(): string {
  let secret = getSetting("auth_session_secret");
  if (!secret) {
    secret = crypto.randomBytes(32).toString("hex");
    setSetting("auth_session_secret", secret);
  }
  return secret;
}

export function isAuthConfigured(): boolean {
  return getSetting("auth_configured") === "1";
}

export function getAuthMethod(): AuthMethod {
  return getSetting("auth_method") === "password" ? "password" : "none";
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPasswordHash(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const attempt = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return attempt.length === expected.length && crypto.timingSafeEqual(attempt, expected);
}

export function verifyPassword(password: string): boolean {
  const stored = getSetting("auth_password_hash");
  if (!stored) return false;
  return verifyPasswordHash(password, stored);
}

export function setPassword(password: string): void {
  setSetting("auth_password_hash", hashPassword(password));
  setSetting("auth_method", "password");
  setSetting("auth_configured", "1");
}

export function setAuthMethod(method: AuthMethod): void {
  setSetting("auth_method", method);
  setSetting("auth_configured", "1");
}

export function removePassword(): void {
  setSetting("auth_password_hash", "");
  setSetting("auth_method", "none");
  setSetting("auth_configured", "1");
}

export function createSessionToken(): string {
  const secret = getOrCreateSessionSecret();
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `ok.${expires}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [marker, expiresStr, sig] = parts;
  if (marker !== "ok") return false;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  const secret = getOrCreateSessionSecret();
  const expected = crypto.createHmac("sha256", secret).update(`ok.${expiresStr}`).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
