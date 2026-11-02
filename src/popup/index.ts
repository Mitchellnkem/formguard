import { getDrafts } from "../shared/storage";
import type { RuntimeMessage, SiteStatus } from "../shared/types";

const statusText = document.querySelector<HTMLElement>("#site-status");
const toggle = document.querySelector<HTMLButtonElement>("#site-toggle");
const draftCount = document.querySelector<HTMLElement>("#draft-count");
const manage = document.querySelector<HTMLButtonElement>("#manage-drafts");

let currentStatus: SiteStatus = { available: false, enabled: false };

async function activeTab(): Promise<chrome.tabs.Tab | undefined> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function sendToActiveTab(message: RuntimeMessage): Promise<SiteStatus> {
  const tab = await activeTab();
  if (tab?.id === undefined) return { available: false, enabled: false };
  try {
    return await chrome.tabs.sendMessage(tab.id, message) as SiteStatus;
  } catch {
    return { available: false, enabled: false };
  }
}

function renderStatus(status: SiteStatus): void {
  currentStatus = status;
  if (!statusText || !toggle) return;
  if (!status.available) {
    statusText.textContent = "Unavailable on this page";
    toggle.hidden = true;
    return;
  }
  statusText.textContent = status.enabled ? "Active on this site" : "Disabled on this site";
  toggle.textContent = status.enabled ? "Disable on this website" : "Enable on this website";
  toggle.hidden = false;
}

async function initialize(): Promise<void> {
  const [drafts, status] = await Promise.all([
    getDrafts(),
    sendToActiveTab({ type: "FORMGUARD_GET_STATUS" })
  ]);
  if (draftCount) draftCount.textContent = `${drafts.length} saved`;
  renderStatus(status);
}

toggle?.addEventListener("click", async () => {
  toggle.disabled = true;
  const status = await sendToActiveTab({ type: "FORMGUARD_SET_SITE_ENABLED", enabled: !currentStatus.enabled });
  renderStatus(status);
  toggle.disabled = false;
});

manage?.addEventListener("click", () => void chrome.runtime.openOptionsPage());
void initialize();
