import { DraftManager } from "./draft-manager";
import { isOriginEnabled, setOriginEnabled } from "../shared/storage";
import type { RuntimeMessage, SiteStatus } from "../shared/types";

let manager = new DraftManager();
void manager.start();

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse: (value: SiteStatus) => void) => {
  if (message.type === "FORMGUARD_GET_STATUS") {
    void isOriginEnabled(location.origin).then((enabled) => sendResponse({ available: true, enabled, origin: location.origin }));
    return true;
  }
  if (message.type === "FORMGUARD_SET_SITE_ENABLED") {
    void (async () => {
      await setOriginEnabled(location.origin, message.enabled);
      manager.stop();
      if (message.enabled) {
        manager = new DraftManager();
        await manager.start();
      }
      sendResponse({ available: true, enabled: message.enabled, origin: location.origin });
    })();
    return true;
  }
  return false;
});
