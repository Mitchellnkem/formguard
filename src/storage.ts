import {
  DEFAULT_SETTINGS,
  DRAFT_PREFIX,
  SETTINGS_KEY,
  clampInteger,
  type DraftRecord,
  type FormGuardSettings
} from "./utils";

function storageKey(id: string): string {
  return `${DRAFT_PREFIX}${id}`;
}

export async function getSettings(): Promise<FormGuardSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  const stored = result[SETTINGS_KEY] as Partial<FormGuardSettings> | undefined;
  return {
    enabled: stored?.enabled ?? DEFAULT_SETTINGS.enabled,
    excludedHosts: Array.isArray(stored?.excludedHosts)
      ? stored.excludedHosts.filter((host): host is string => typeof host === "string")
      : [],
    retentionDays: clampInteger(stored?.retentionDays ?? DEFAULT_SETTINGS.retentionDays, 1, 90)
  };
}

export async function saveSettings(settings: FormGuardSettings): Promise<void> {
  await chrome.storage.local.set({
    [SETTINGS_KEY]: {
      enabled: settings.enabled,
      excludedHosts: [...new Set(settings.excludedHosts.map((host) => host.toLowerCase()))],
      retentionDays: clampInteger(settings.retentionDays, 1, 90)
    }
  });
}

export async function saveDraft(draft: DraftRecord): Promise<void> {
  await chrome.storage.local.set({ [storageKey(draft.id)]: draft });
}

export async function getDraft(id: string): Promise<DraftRecord | undefined> {
  const key = storageKey(id);
  const result = await chrome.storage.local.get(key);
  return result[key] as DraftRecord | undefined;
}

export async function getAllDrafts(): Promise<DraftRecord[]> {
  const result = await chrome.storage.local.get(null);
  return Object.entries(result)
    .filter(([key]) => key.startsWith(DRAFT_PREFIX))
    .map(([, value]) => value as DraftRecord)
    .filter((draft) => typeof draft?.id === "string" && typeof draft?.content === "string")
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteDraft(id: string): Promise<void> {
  await chrome.storage.local.remove(storageKey(id));
}

export async function clearDrafts(): Promise<void> {
  const result = await chrome.storage.local.get(null);
  const keys = Object.keys(result).filter((key) => key.startsWith(DRAFT_PREFIX));
  if (keys.length > 0) await chrome.storage.local.remove(keys);
}

export async function cleanupExpiredDrafts(now = Date.now()): Promise<number> {
  const drafts = await getAllDrafts();
  const expired = drafts.filter((draft) => draft.expiresAt <= now).map((draft) => storageKey(draft.id));
  if (expired.length > 0) await chrome.storage.local.remove(expired);
  return expired.length;
}
