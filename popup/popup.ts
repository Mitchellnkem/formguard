export {};

interface StatusResponse {
  enabled: boolean;
  hostname: string;
  draftCount: number;
}

const status = document.querySelector<HTMLElement>("#status")!;
const count = document.querySelector<HTMLElement>("#draft-count")!;
const toggle = document.querySelector<HTMLButtonElement>("#toggle")!;
const manage = document.querySelector<HTMLButtonElement>("#manage")!;
const message = document.querySelector<HTMLElement>("#message")!;
let current: StatusResponse | undefined;
let activeTabId: number | undefined;

function render(response: StatusResponse): void {
  current = response;
  status.textContent = response.enabled ? `Active on ${response.hostname}` : `Disabled on ${response.hostname}`;
  count.textContent = `${response.draftCount} saved`;
  toggle.textContent = response.enabled ? "Disable on this website" : "Enable on this website";
  toggle.disabled = false;
}

async function initialize(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabId = tab?.id;
  if (activeTabId === undefined) throw new Error("No active tab");
  const response = await chrome.tabs.sendMessage(activeTabId, { type: "FORMGUARD_GET_STATUS" }) as StatusResponse;
  render(response);
}

toggle.addEventListener("click", async () => {
  if (!current || activeTabId === undefined) return;
  toggle.disabled = true;
  try {
    const response = await chrome.tabs.sendMessage(activeTabId, {
      type: "FORMGUARD_SET_SITE_ENABLED",
      enabled: !current.enabled
    }) as { enabled: boolean };
    render({ ...current, enabled: response.enabled });
  } catch {
    message.textContent = "This page cannot be changed.";
    toggle.disabled = false;
  }
});

manage.addEventListener("click", () => void chrome.runtime.openOptionsPage());

void initialize().catch(() => {
  status.textContent = "Unavailable on this page";
  count.textContent = "Open Manage drafts";
  toggle.disabled = true;
});
