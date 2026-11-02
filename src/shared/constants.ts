export const STORAGE_KEYS = {
  drafts: "draftsV1",
  settings: "settingsV1"
} as const;

export const DEFAULT_RETENTION_DAYS = 7;
export const MAX_DRAFTS = 100;
export const MAX_DRAFT_LENGTH = 100_000;
export const SAVE_DEBOUNCE_MS = 700;
export const MIN_MEANINGFUL_LENGTH = 2;
export const MATCH_VERSION = "v1";

export const DEFAULT_SETTINGS = {
  disabledOrigins: [],
  retentionDays: DEFAULT_RETENTION_DAYS
} as const;
