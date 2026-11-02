import { clearDrafts, deleteDraft, getDrafts, getSettings, setSettings } from "../shared/storage";
import type { Draft } from "../shared/types";
import { createElement, formatRelativeTime } from "../shared/utils";

const list = document.querySelector<HTMLElement>("#draft-list");
const empty = document.querySelector<HTMLElement>("#empty-state");
const clear = document.querySelector<HTMLButtonElement>("#clear-all");
const retention = document.querySelector<HTMLSelectElement>("#retention-days");
const disabledList = document.querySelector<HTMLElement>("#disabled-list");

function draftRow(draft: Draft): HTMLElement {
  const row = createElement("li", undefined, "draft-row");
  const copy = createElement("div", undefined, "draft-copy");
  copy.append(createElement("strong", draft.fieldLabel));
  copy.append(createElement("span", `${draft.origin}${draft.pathname}`));
  copy.append(createElement("small", `Saved ${formatRelativeTime(draft.updatedAt)}`));
  const button = createElement("button", "Delete");
  button.type = "button";
  button.addEventListener("click", async () => {
    button.disabled = true;
    await deleteDraft(draft.id);
    await render();
  });
  row.append(copy, button);
  return row;
}

async function render(): Promise<void> {
  const [drafts, settings] = await Promise.all([getDrafts(), getSettings()]);
  list?.replaceChildren(...drafts.map(draftRow));
  if (empty) empty.hidden = drafts.length !== 0;
  if (clear) clear.disabled = drafts.length === 0;
  if (retention) retention.value = String(settings.retentionDays);
  if (disabledList) {
    disabledList.replaceChildren(...settings.disabledOrigins.map((origin) => {
      const item = createElement("li");
      item.append(createElement("span", origin));
      const enable = createElement("button", "Enable");
      enable.type = "button";
      enable.addEventListener("click", async () => {
        await setSettings({ ...settings, disabledOrigins: settings.disabledOrigins.filter((item) => item !== origin) });
        await render();
      });
      item.append(enable);
      return item;
    }));
  }
}

clear?.addEventListener("click", async () => {
  if (!confirm("Delete every saved FormGuard draft? This cannot be undone.")) return;
  await clearDrafts();
  await render();
});

retention?.addEventListener("change", async () => {
  const settings = await getSettings();
  await setSettings({ ...settings, retentionDays: Number(retention.value) });
  await render();
});

void render();
