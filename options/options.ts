import { cleanupExpiredDrafts, clearDrafts, deleteDraft, getAllDrafts, getSettings, saveSettings } from "../src/storage";
import { clampInteger, relativeTime, type DraftRecord, type FormGuardSettings } from "../src/utils";

const enabled = document.querySelector<HTMLInputElement>("#enabled")!;
const retention = document.querySelector<HTMLInputElement>("#retention")!;
const draftsElement = document.querySelector<HTMLElement>("#drafts")!;
const summary = document.querySelector<HTMLElement>("#summary")!;
const excluded = document.querySelector<HTMLElement>("#excluded")!;
const clear = document.querySelector<HTMLButtonElement>("#clear")!;
const message = document.querySelector<HTMLElement>("#message")!;
let settings: FormGuardSettings;
let hideMessageTimer: ReturnType<typeof setTimeout> | undefined;

function notify(text: string): void {
  message.textContent = text;
  message.classList.add("visible");
  if (hideMessageTimer) clearTimeout(hideMessageTimer);
  hideMessageTimer = setTimeout(() => message.classList.remove("visible"), 2_000);
}

function renderDrafts(drafts: DraftRecord[]): void {
  draftsElement.replaceChildren();
  summary.textContent = `${drafts.length} draft${drafts.length === 1 ? "" : "s"}, stored on this device only.`;
  clear.disabled = drafts.length === 0;
  if (drafts.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No saved drafts.";
    draftsElement.append(empty);
    return;
  }
  for (const draft of drafts) {
    const row = document.createElement("div");
    row.className = "draft";
    const details = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = draft.fieldLabel;
    const metadata = document.createElement("small");
    metadata.textContent = `${draft.hostname}${draft.pathname} · saved ${relativeTime(draft.updatedAt)} · ${draft.content.length} characters`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Delete";
    button.addEventListener("click", async () => {
      await deleteDraft(draft.id);
      renderDrafts(await getAllDrafts());
      notify("Draft deleted");
    });
    details.append(title, metadata);
    row.append(details, button);
    draftsElement.append(row);
  }
}

function renderExcluded(): void {
  excluded.replaceChildren();
  if (settings.excludedHosts.length === 0) {
    const empty = document.createElement("span");
    empty.textContent = "No excluded websites";
    excluded.append(empty);
    return;
  }
  for (const host of settings.excludedHosts) {
    const item = document.createElement("span");
    const label = document.createTextNode(host);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.setAttribute("aria-label", `Enable FormGuard on ${host}`);
    remove.textContent = "×";
    remove.addEventListener("click", async () => {
      settings = { ...settings, excludedHosts: settings.excludedHosts.filter((itemHost) => itemHost !== host) };
      await saveSettings(settings);
      renderExcluded();
      notify("Website enabled");
    });
    item.append(label, remove);
    excluded.append(item);
  }
}

async function persistSettings(): Promise<void> {
  settings = {
    ...settings,
    enabled: enabled.checked,
    retentionDays: clampInteger(retention.valueAsNumber, 1, 90)
  };
  retention.value = settings.retentionDays.toString();
  await saveSettings(settings);
  notify("Settings saved");
}

enabled.addEventListener("change", () => void persistSettings());
retention.addEventListener("change", () => void persistSettings());
clear.addEventListener("click", async () => {
  if (!confirm("Delete every saved FormGuard draft? This cannot be undone.")) return;
  await clearDrafts();
  renderDrafts([]);
  notify("All drafts deleted");
});

async function initialize(): Promise<void> {
  await cleanupExpiredDrafts();
  settings = await getSettings();
  enabled.checked = settings.enabled;
  retention.value = settings.retentionDays.toString();
  renderExcluded();
  renderDrafts(await getAllDrafts());
}

void initialize().catch(() => notify("Could not load FormGuard settings"));
