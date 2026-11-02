import { isEligibleField, type SupportedField } from "./security";

const FIELD_SELECTOR = "input, textarea, [contenteditable]";

export function detectFields(root: ParentNode = document): SupportedField[] {
  return Array.from(root.querySelectorAll(FIELD_SELECTOR)).filter(isEligibleField);
}

export function observeFields(onField: (field: SupportedField) => void): MutationObserver {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (!(node instanceof Element)) continue;
        if (isEligibleField(node)) onField(node);
        for (const field of detectFields(node)) onField(field);
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  return observer;
}

export function readFieldValue(field: SupportedField): string {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) return field.value;
  return field.innerText || field.textContent || "";
}

export function writeFieldValue(field: SupportedField, value: string): void {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    const prototype = field instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    setter?.call(field, value);
  } else {
    field.textContent = value;
  }
  field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertReplacementText", data: null }));
}
