import type { SupportedField } from "./types";
import { isSensitiveField } from "./sensitivity";

const ALLOWED_INPUT_TYPES = new Set(["text", "search", "email", "url", "tel"]);

export function isContentEditableField(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  const value = element.getAttribute("contenteditable");
  return value === "" || value === "true" || value === "plaintext-only";
}

export function isSupportedField(element: Element): element is SupportedField {
  if (element instanceof HTMLInputElement) return ALLOWED_INPUT_TYPES.has(element.type.toLowerCase());
  if (element instanceof HTMLTextAreaElement) return true;
  return isContentEditableField(element);
}

export function isEligibleField(element: Element): element is SupportedField {
  if (!isSupportedField(element) || isSensitiveField(element)) return false;
  if (element.getAttribute("data-formguard") === "off") return false;
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    if (element.disabled || element.readOnly) return false;
    if (element.hidden) return false;
  }
  if (element.closest("[hidden], [aria-hidden='true']")) return false;
  return true;
}

export function findEligibleFields(root: ParentNode = document): SupportedField[] {
  return Array.from(root.querySelectorAll("input, textarea, [contenteditable]"))
    .filter(isEligibleField);
}

export function readFieldValue(field: SupportedField): string {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) return field.value;
  return field.textContent ?? "";
}

export function writeFieldValue(field: SupportedField, value: string): void {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    const prototype = field instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    setter?.call(field, value);
  } else {
    field.textContent = value;
  }
  field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: null }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

export function fieldDisplayLabel(field: SupportedField): string {
  const aria = field.getAttribute("aria-label");
  if (aria?.trim()) return aria.trim().slice(0, 80);
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    const label = field.labels?.[0]?.textContent?.trim();
    if (label) return label.slice(0, 80);
    if (field.placeholder.trim()) return field.placeholder.trim().slice(0, 80);
    if (field.name.trim()) return field.name.trim().slice(0, 80);
  }
  return field.id.trim().slice(0, 80) || "Text field";
}
