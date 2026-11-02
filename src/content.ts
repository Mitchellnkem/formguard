import { deleteDraftForField, findDraftForField, persistFieldDraft } from "./draft-manager";
import { detectFields, observeFields, readFieldValue, writeFieldValue } from "./field-detector";
import { type SupportedField } from "./security";
import { cleanupExpiredDrafts, deleteDraft, getAllDrafts, getSettings, saveSettings } from "./storage";
import { debounce, getPageIdentity, isHostExcluded, relativeTime, type DraftRecord, type FormGuardSettings } from "./utils";

const AUTOSAVE_DELAY_MS = 700;
const boundFields = new WeakSet<SupportedField>();
const restoringFields = new WeakSet<SupportedField>();
const inputRevision = new WeakMap<SupportedField, number>();
const promptByField = new Map<SupportedField, HTMLElement>();
let settings: FormGuardSettings;
let active = false;
let lastPathname = location.pathname;

function removePrompt(field: SupportedField): void {
  promptByField.get(field)?.remove();
  promptByField.delete(field);
}

function createRecoveryPrompt(field: SupportedField, draft: DraftRecord): void {
  if (promptByField.has(field) || !field.isConnected) return;
  const host = document.createElement("div");
  host.style.cssText = "all:initial;display:block;position:relative;z-index:2147483647";
  host.setAttribute("data-formguard-recovery", "");
  const shadow = host.attachShadow({ mode: "closed" });
  const panel = document.createElement("div");
  panel.setAttribute("role", "status");
  panel.style.cssText = [
    "box-sizing:border-box", "font:13px/1.4 system-ui,sans-serif", "color:#172033",
    "background:#fff", "border:1px solid #c8d5ee", "border-radius:8px", "box-shadow:0 4px 14px #0002",
    "margin:6px 0", "padding:10px 12px", "max-width:360px"
  ].join(";");

  const title = document.createElement("strong");
  title.textContent = "Unsaved writing recovered";
  const time = document.createElement("div");
  time.textContent = `Saved ${relativeTime(draft.updatedAt)}`;
  time.style.cssText = "color:#53627a;margin:2px 0 8px";
  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;gap:7px";
  const restore = document.createElement("button");
  restore.type = "button";
  restore.textContent = "Restore";
  restore.style.cssText = "font:inherit;border:0;border-radius:6px;padding:6px 10px;background:#1a73e8;color:white;cursor:pointer";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "Delete";
  remove.style.cssText = "font:inherit;border:1px solid #c8d0dd;border-radius:6px;padding:6px 10px;background:white;color:#28364e;cursor:pointer";

  let replaceArmedUntil = 0;
  restore.addEventListener("click", async () => {
    const current = readFieldValue(field);
    if (current.trim() && current !== draft.content && Date.now() > replaceArmedUntil) {
      replaceArmedUntil = Date.now() + 5_000;
      restore.textContent = "Replace current text?";
      return;
    }
    restoringFields.add(field);
    writeFieldValue(field, draft.content);
    await deleteDraft(draft.id);
    removePrompt(field);
    field.focus();
  });
  remove.addEventListener("click", async () => {
    await deleteDraft(draft.id);
    removePrompt(field);
  });

  actions.append(restore, remove);
  panel.append(title, time, actions);
  shadow.append(panel);
  field.insertAdjacentElement("afterend", host);
  promptByField.set(field, host);
}

async function offerRecovery(field: SupportedField): Promise<void> {
  if (!active) return;
  const draft = await findDraftForField(field);
  if (draft && draft.expiresAt > Date.now() && draft.content !== readFieldValue(field)) {
    createRecoveryPrompt(field, draft);
  }
}

function bindField(field: SupportedField): void {
  if (boundFields.has(field)) {
    void offerRecovery(field);
    return;
  }
  boundFields.add(field);
  const save = debounce(async (revision: number) => {
    if (!active || inputRevision.get(field) !== revision) return;
    try {
      await persistFieldDraft(field, readFieldValue(field), settings.retentionDays);
    } catch (error) {
      console.warn("FormGuard could not save a draft.", error);
    }
  }, AUTOSAVE_DELAY_MS);
  field.addEventListener("input", () => {
    if (restoringFields.delete(field)) return;
    const revision = (inputRevision.get(field) ?? 0) + 1;
    inputRevision.set(field, revision);
    save(revision);
  });
  void offerRecovery(field);
}

function removeAllPrompts(): void {
  for (const host of promptByField.values()) host.remove();
  promptByField.clear();
}

async function refreshActiveState(): Promise<void> {
  settings = await getSettings();
  active = settings.enabled && !isHostExcluded(location.hostname, settings.excludedHosts);
  if (!active) removeAllPrompts();
}

async function setSiteEnabled(enabled: boolean): Promise<void> {
  const host = location.hostname.toLowerCase();
  const excluded = new Set(settings.excludedHosts);
  if (enabled) excluded.delete(host);
  else excluded.add(host);
  settings = { ...settings, excludedHosts: [...excluded] };
  await saveSettings(settings);
  await refreshActiveState();
  if (active) detectFields().forEach(bindField);
}

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement)) return;
  for (const field of detectFields(event.target)) {
    inputRevision.set(field, (inputRevision.get(field) ?? 0) + 1);
    void deleteDraftForField(field);
  }
}, true);

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!message || typeof message !== "object") return false;
  const type = (message as { type?: string }).type;
  if (type === "FORMGUARD_GET_STATUS") {
    void getAllDrafts().then((drafts) => sendResponse({
      enabled: active,
      hostname: location.hostname,
      draftCount: drafts.length
    }));
    return true;
  }
  if (type === "FORMGUARD_SET_SITE_ENABLED") {
    const enabled = Boolean((message as { enabled?: boolean }).enabled);
    void setSiteEnabled(enabled).then(() => sendResponse({ ok: true, enabled: active }));
    return true;
  }
  return false;
});

async function initialize(): Promise<void> {
  await refreshActiveState();
  await cleanupExpiredDrafts();
  if (active) detectFields().forEach(bindField);
  observeFields((field) => {
    if (active) bindField(field);
  });
  window.setInterval(() => {
    if (location.pathname !== lastPathname) {
      lastPathname = location.pathname;
      removeAllPrompts();
      if (active) detectFields().forEach(bindField);
    }
  }, 2_000);
}

void initialize().catch((error) => console.warn("FormGuard could not initialize.", error));
