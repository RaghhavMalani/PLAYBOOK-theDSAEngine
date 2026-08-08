import {
  createLearningBackup,
  mergeLearningBackups,
  parseLearningBackup,
  restoreLearningBackup,
  type LearningBackup,
} from "./learning-backup";
import {
  LEARNING_DATA_KEYS,
  LEARNING_STATE_CHANGED_EVENT,
  ensureLearningMetadata,
} from "./learning-state";
import { STORE_PREFIX } from "./dom";

const AUTH_STORAGE_KEY = STORE_PREFIX + "cloudSession";
export const CLOUD_SYNC_STATUS_EVENT = "dsa:cloud-sync-status";

interface CloudSyncConfig {
  url: string;
  anonKey: string;
}

export interface CloudSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  email: string;
}

export interface AuthResult {
  session: CloudSession | null;
  message: string;
}

export interface CloudSyncResult {
  pulled: number;
  pushed: number;
  firstUpload: boolean;
  syncedAt: string;
}

interface AuthPayload {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: { id?: string; email?: string };
  error_description?: string;
  msg?: string;
}

const config = (): CloudSyncConfig | null => {
  const url = String(import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "");
  return url && anonKey ? { url, anonKey } : null;
};

export const cloudSyncAvailable = (): boolean => config() !== null;

function emitStatus(detail: Record<string, unknown>): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CLOUD_SYNC_STATUS_EVENT, { detail }));
  }
}

function readSession(storage: Pick<Storage, "getItem">): CloudSession | null {
  try {
    const value = JSON.parse(storage.getItem(AUTH_STORAGE_KEY) ?? "null") as Partial<CloudSession> | null;
    if (!value || typeof value.accessToken !== "string" || typeof value.refreshToken !== "string" ||
        typeof value.expiresAt !== "number" || typeof value.userId !== "string") return null;
    return { ...value, email: typeof value.email === "string" ? value.email : "" } as CloudSession;
  } catch {
    return null;
  }
}

function writeSession(storage: Pick<Storage, "setItem">, session: CloudSession): void {
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function currentCloudSession(storage: Pick<Storage, "getItem"> = localStorage): CloudSession | null {
  return readSession(storage);
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { message?: string; msg?: string; error_description?: string; error?: string };
    return body.message ?? body.msg ?? body.error_description ?? body.error ?? `${response.status} ${response.statusText}`;
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

async function authRequest(path: string, body: Record<string, unknown>): Promise<AuthPayload> {
  const settings = config();
  if (!settings) throw new Error("Cloud sync is not configured for this deployment.");
  const response = await fetch(`${settings.url}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: settings.anonKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<AuthPayload>;
}

function sessionFrom(payload: AuthPayload): CloudSession | null {
  if (!payload.access_token || !payload.refresh_token || !payload.user?.id) return null;
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + Math.max(60, payload.expires_in ?? 3600) * 1000,
    userId: payload.user.id,
    email: payload.user.email ?? "",
  };
}

export async function signInForSync(
  email: string,
  password: string,
  storage: Pick<Storage, "setItem"> = localStorage,
): Promise<AuthResult> {
  const payload = await authRequest("token?grant_type=password", { email, password });
  const session = sessionFrom(payload);
  if (!session) throw new Error("The authentication service did not return a session.");
  writeSession(storage, session);
  emitStatus({ state: "signed-in", email: session.email });
  return { session, message: "Signed in. Local learning data is ready to sync." };
}

export async function createSyncAccount(
  email: string,
  password: string,
  storage: Pick<Storage, "setItem"> = localStorage,
): Promise<AuthResult> {
  const payload = await authRequest("signup", { email, password });
  const session = sessionFrom(payload);
  if (session) {
    writeSession(storage, session);
    emitStatus({ state: "signed-in", email: session.email });
    return { session, message: "Account created and signed in." };
  }
  return {
    session: null,
    message: "Account created. Confirm the email, then sign in to sync.",
  };
}

async function refreshSession(session: CloudSession, storage: Pick<Storage, "setItem">): Promise<CloudSession> {
  if (session.expiresAt > Date.now() + 60_000) return session;
  const payload = await authRequest("token?grant_type=refresh_token", { refresh_token: session.refreshToken });
  const refreshed = sessionFrom(payload);
  if (!refreshed) throw new Error("The cloud session expired. Sign in again.");
  writeSession(storage, refreshed);
  return refreshed;
}

export async function signOutFromSync(storage: Storage = localStorage): Promise<void> {
  const settings = config();
  const session = readSession(storage);
  if (settings && session) {
    try {
      await fetch(`${settings.url}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: settings.anonKey, Authorization: `Bearer ${session.accessToken}` },
      });
    } catch {
      // Local sign-out must still work while offline.
    }
  }
  storage.removeItem(AUTH_STORAGE_KEY);
  emitStatus({ state: "signed-out" });
}

async function remoteRequest(
  path: string,
  session: CloudSession,
  init: RequestInit = {},
): Promise<Response> {
  const settings = config();
  if (!settings) throw new Error("Cloud sync is not configured for this deployment.");
  const response = await fetch(`${settings.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: settings.anonKey,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(await readError(response));
  return response;
}

async function readRemoteBackup(session: CloudSession): Promise<LearningBackup | null> {
  const query = `learning_state?select=backup&user_id=eq.${encodeURIComponent(session.userId)}&limit=1`;
  const response = await remoteRequest(query, session);
  const rows = await response.json() as { backup?: unknown }[];
  return rows[0]?.backup ? parseLearningBackup(rows[0].backup) : null;
}

async function writeRemoteBackup(session: CloudSession, backup: LearningBackup): Promise<void> {
  await remoteRequest("learning_state?on_conflict=user_id", session, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: session.userId, backup, device_id: backup.deviceId }),
  });
}

function changedCounts(local: LearningBackup, remote: LearningBackup | null): Pick<CloudSyncResult, "pulled" | "pushed"> {
  if (!remote) return { pulled: 0, pushed: LEARNING_DATA_KEYS.length };
  let pulled = 0;
  let pushed = 0;
  for (const key of LEARNING_DATA_KEYS) {
    const localTime = Date.parse(local.updatedAt[key] ?? new Date(0).toISOString());
    const remoteTime = Date.parse(remote.updatedAt[key] ?? new Date(0).toISOString());
    if (remoteTime > localTime) pulled++;
    else if (localTime > remoteTime || JSON.stringify(local.data[key]) !== JSON.stringify(remote.data[key])) pushed++;
  }
  return { pulled, pushed };
}

let activeSync: Promise<CloudSyncResult> | null = null;

export function syncLearningState(storage: Storage = localStorage): Promise<CloudSyncResult> {
  if (activeSync) return activeSync;
  activeSync = (async () => {
    if (!cloudSyncAvailable()) throw new Error("Cloud sync is not configured for this deployment.");
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new Error("Offline. Changes remain saved locally and will sync after reconnection.");
    }
    let session = readSession(storage);
    if (!session) throw new Error("Sign in before syncing.");
    session = await refreshSession(session, storage);
    ensureLearningMetadata(storage, STORE_PREFIX);

    emitStatus({ state: "syncing" });
    const local = createLearningBackup(storage);
    const remote = await readRemoteBackup(session);
    const counts = changedCounts(local, remote);
    const merged = remote ? mergeLearningBackups(local, remote) : local;
    restoreLearningBackup(merged, storage);
    await writeRemoteBackup(session, merged);
    const result: CloudSyncResult = {
      ...counts,
      firstUpload: remote === null,
      syncedAt: new Date().toISOString(),
    };
    emitStatus({ state: "synced", ...result });
    return result;
  })().catch((error: unknown) => {
    emitStatus({ state: "error", message: error instanceof Error ? error.message : String(error) });
    throw error;
  }).finally(() => {
    activeSync = null;
  });
  return activeSync;
}

let autoSyncTimer: ReturnType<typeof setTimeout> | null = null;

export function initCloudSync(): void {
  if (typeof window === "undefined" || !cloudSyncAvailable()) return;
  const schedule = (): void => {
    if (!currentCloudSession()) return;
    if (autoSyncTimer) clearTimeout(autoSyncTimer);
    autoSyncTimer = setTimeout(() => {
      void syncLearningState().catch(() => { /* status event reports the actionable error */ });
    }, 1_500);
  };
  window.addEventListener(LEARNING_STATE_CHANGED_EVENT, (event) => {
    const detail = (event as CustomEvent<{ source?: string }>).detail;
    if (detail?.source === "local") schedule();
  });
  window.addEventListener("online", schedule);
  if (currentCloudSession()) schedule();
}

