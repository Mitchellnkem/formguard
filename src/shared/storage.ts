import { DEFAULT_SETTINGS, MAX_DRAFTS, STORAGE_KEYS } from "./constants";
import type { Draft, Settings } from "./types";

let mutationQueue: Promise<void> = Promise.resolve();

function enqueueMutation(operation: () => Promise<void>): Promise<void> {
  const result = mutationQueue.then(operation, operation);
  mutationQueue = result.catch(() => undefined);
  return result;
}

function normalizeSettings(input: Partial<Settings> | undefined): Settings {
  const retention = Number(input?.retentionDays);
  return {
    disabledOrigins: Array.isArray(input?.disabledOrigins)
      ? [...new Set(input.disabledOrigins.filter((item): item is string => typeof item === "string"))]
      : [],
    retentionDays: Number.isFinite(retention) && retention >= 1 && retention <= 30
      ? Math.floor(retention)
      : DEFAULT_SETTINGS.retentionDays
  };
}

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.settings);
  return normalizeSettings(result[STORAGE_KEYS.settings] as Partial<Settings> | undefined);
}

export async function setSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: normalizeSettings(settings) });
}

export async function isOriginEnabled(origin: string): Promise<boolean> {
  const settings = await getSettings();
  return !settings.disabledOrigins.includes(origin);
}

export async function setOriginEnabled(origin: string, enabled: boolean): Promise<void> {
  const settings = await getSettings();
  const disabled = new Set(settings.disabledOrigins);
  if (enabled) disabled.delete(origin);
  else disabled.add(origin);
  await setSettings({ ...settings, disabledOrigins: [...disabled].sort() });
}

export async function getDrafts(now = Date.now()): Promise<Draft[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.drafts);
  const raw = result[STORAGE_KEYS.drafts];
  const drafts = Array.isArray(raw) ? raw.filter(isValidDraft) : [];
  const active = drafts.filter((draft) => draft.expiresAt > now);
  if (active.length !== drafts.length) await writeDrafts(active);
  return active.sort((a, b) => b.updatedAt - a.updatedAt);
}

function isValidDraft(value: unknown): value is Draft {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Draft>;
  return typeof item.id === "string" && typeof item.value === "string" && typeof item.origin === "string" &&
    typeof item.pathname === "string" && typeof item.fieldLabel === "string" && typeof item.createdAt === "number" &&
    typeof item.updatedAt === "number" && typeof item.expiresAt === "number";
}

async function writeDrafts(drafts: Draft[]): Promise<void> {
  const bounded = [...drafts].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_DRAFTS);
  await chrome.storage.local.set({ [STORAGE_KEYS.drafts]: bounded });
}

export async function getDraft(id: string): Promise<Draft | undefined> {
  return (await getDrafts()).find((draft) => draft.id === id);
}

export async function upsertDraft(draft: Draft): Promise<void> {
  await enqueueMutation(async () => {
    const drafts = await getDrafts();
    const existingIndex = drafts.findIndex((item) => item.id === draft.id);
    if (existingIndex >= 0) drafts[existingIndex] = draft;
    else drafts.push(draft);
    await writeDrafts(drafts);
  });
}

export async function deleteDraft(id: string): Promise<void> {
  await enqueueMutation(async () => {
    await writeDrafts((await getDrafts()).filter((draft) => draft.id !== id));
  });
}

export async function clearDrafts(): Promise<void> {
  await enqueueMutation(async () => {
    await chrome.storage.local.set({ [STORAGE_KEYS.drafts]: [] });
  });
}
