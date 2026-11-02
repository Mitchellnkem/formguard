import type { Draft, SupportedField } from "../shared/types";
import { createElement, formatRelativeTime } from "../shared/utils";

const STYLE = `
  :host { all: initial; }
  .card { box-sizing: border-box; display: inline-flex; align-items: center; gap: 8px; margin: 6px 0; padding: 8px 10px;
    border: 1px solid #c8d4cc; border-radius: 8px; background: #f5fbf7; color: #173d2b;
    font: 13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; box-shadow: 0 2px 7px rgba(0,0,0,.08); }
  .copy { display: flex; flex-direction: column; margin-right: 3px; }
  .title { font-weight: 650; }
  .time { color: #4d6559; font-size: 11px; }
  button { appearance: none; border: 1px solid #426d57; border-radius: 6px; padding: 5px 9px; background: #fff; color: #214c36;
    cursor: pointer; font: 600 12px/1 system-ui, sans-serif; }
  button.primary { border-color: #1d6842; background: #1d6842; color: #fff; }
  button:focus-visible { outline: 2px solid #148654; outline-offset: 2px; }
`;

export interface RecoveryControl {
  remove(): void;
}

export function showRecoveryControl(
  field: SupportedField,
  draft: Draft,
  onRestore: () => void,
  onDelete: () => void
): RecoveryControl {
  const host = document.createElement("span");
  host.setAttribute("data-formguard-ui", "recovery");
  const shadow = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = STYLE;
  const card = createElement("span", undefined, "card");
  card.setAttribute("role", "status");
  const copy = createElement("span", undefined, "copy");
  copy.append(createElement("span", "Unsaved writing recovered", "title"));
  copy.append(createElement("span", `Saved ${formatRelativeTime(draft.updatedAt)}`, "time"));
  const restore = createElement("button", "Restore", "primary");
  restore.type = "button";
  const remove = createElement("button", "Delete");
  remove.type = "button";
  restore.addEventListener("click", onRestore);
  remove.addEventListener("click", onDelete);
  card.append(copy, restore, remove);
  shadow.append(style, card);
  field.insertAdjacentElement("afterend", host);
  return { remove: () => host.remove() };
}
