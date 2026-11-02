export const DRAFT_PREFIX = "draft:";
export const SETTINGS_KEY = "settings";
export const DEFAULT_RETENTION_DAYS = 14;
export const MAX_DRAFT_LENGTH = 200_000;

export interface FormGuardSettings {
  enabled: boolean;
  excludedHosts: string[];
  retentionDays: number;
}

export interface DraftRecord {
  id: string;
  origin: string;
  pathname: string;
  hostname: string;
  formFingerprint: string;
  fieldFingerprint: string;
  fieldLabel: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export interface PageIdentity {
  origin: string;
  pathname: string;
  hostname: string;
}

export const DEFAULT_SETTINGS: FormGuardSettings = {
  enabled: true,
  excludedHosts: [],
  retentionDays: DEFAULT_RETENTION_DAYS
};

export function normalizePathname(pathname: string): string {
  const normalized = pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "");
  return normalized || "/";
}

export function getPageIdentity(locationLike: Pick<Location, "origin" | "pathname" | "hostname">): PageIdentity {
  return {
    origin: locationLike.origin.toLowerCase(),
    pathname: normalizePathname(locationLike.pathname),
    hostname: locationLike.hostname.toLowerCase()
  };
}

export function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function isHostExcluded(hostname: string, excludedHosts: string[]): boolean {
  const host = hostname.toLowerCase();
  return excludedHosts.some((excluded) => host === excluded || host.endsWith(`.${excluded}`));
}

export function relativeTime(timestamp: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function debounce<T extends unknown[]>(callback: (...args: T) => void, delayMs: number): (...args: T) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: T) => {
    if (timeout !== undefined) clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), delayMs);
  };
}

export function truncate(value: string, length: number): string {
  return value.length <= length ? value : `${value.slice(0, length - 1)}…`;
}
