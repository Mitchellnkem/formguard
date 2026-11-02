import { truncate } from "./utils";

export type SupportedField = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

const DENIED_INPUT_TYPES = new Set([
  "password", "hidden", "number", "date", "datetime-local", "month", "week", "time",
  "checkbox", "radio", "file", "submit", "reset", "button", "image", "range", "color"
]);

const ALLOWED_INPUT_TYPES = new Set(["", "text", "search", "email", "url", "tel"]);

const DENIED_AUTOCOMPLETE = [
  "current-password", "new-password", "one-time-code", "cc-name", "cc-given-name",
  "cc-additional-name", "cc-family-name", "cc-number", "cc-exp", "cc-exp-month",
  "cc-exp-year", "cc-csc", "cc-type", "transaction-amount", "transaction-currency"
];

const SENSITIVE_PATTERNS = [
  /\b(pass(word|phrase)?|passwd|pwd)\b/i,
  /\b(cvv|cvc|cid|security[\s_-]*code|card[\s_-]*(number|no|num)|credit[\s_-]*card|debit[\s_-]*card)\b/i,
  /\b(pin|otp|totp|mfa|2fa|one[\s_-]*time|verification[\s_-]*code|auth(entication)?[\s_-]*code)\b/i,
  /\b(secret|private[\s_-]*key|api[\s_-]*key|access[\s_-]*token|refresh[\s_-]*token|bearer|recovery[\s_-]*(code|key)|seed[\s_-]*phrase)\b/i,
  /\b(ssn|social[\s_-]*security|tax[\s_-]*id|national[\s_-]*id)\b/i
];

function associatedText(element: Element): string {
  const parts: string[] = [];
  const html = element as HTMLElement;
  for (const attribute of ["name", "id", "placeholder", "aria-label", "aria-description", "title", "data-testid"]) {
    const value = element.getAttribute(attribute);
    if (value) parts.push(value);
  }
  if (html.ariaLabel) parts.push(html.ariaLabel);
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    for (const label of Array.from(element.labels ?? [])) parts.push(label.textContent ?? "");
  }
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    for (const id of labelledBy.split(/\s+/)) parts.push(document.getElementById(id)?.textContent ?? "");
  }
  return parts.join(" ").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

export function isContentEditableField(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) return false;
  const attribute = element.getAttribute("contenteditable")?.toLowerCase();
  return (element.isContentEditable || attribute === "" || attribute === "true" || attribute === "plaintext-only") &&
    attribute !== "false";
}

export function isSupportedField(element: Element): element is SupportedField {
  if (element instanceof HTMLTextAreaElement) return !element.disabled && !element.readOnly;
  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase();
    return !element.disabled && !element.readOnly && !DENIED_INPUT_TYPES.has(type) && ALLOWED_INPUT_TYPES.has(type);
  }
  return isContentEditableField(element) && element.getAttribute("role") !== "application";
}

export function isSensitiveField(element: Element): boolean {
  if (!isSupportedField(element)) return true;
  if (element instanceof HTMLInputElement) {
    if (DENIED_INPUT_TYPES.has(element.type.toLowerCase())) return true;
    const autocomplete = element.autocomplete.toLowerCase().split(/\s+/);
    if (autocomplete.some((token) => DENIED_AUTOCOMPLETE.includes(token))) return true;
  }
  const signals = associatedText(element);
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(signals));
}

export function isEligibleField(element: Element): element is SupportedField {
  if (!isSupportedField(element) || isSensitiveField(element)) return false;
  const html = element as HTMLElement;
  if (html.hidden || html.getAttribute("aria-hidden") === "true") return false;
  return true;
}

export function getFieldLabel(element: Element): string {
  const text = associatedText(element);
  if (text) return truncate(text, 80);
  if (element instanceof HTMLTextAreaElement) return "Textarea";
  if (element instanceof HTMLInputElement) return "Text input";
  return "Editable area";
}
