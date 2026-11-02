import { normalizeText } from "./utils";

const BLOCKED_INPUT_TYPES = new Set([
  "password", "hidden", "number", "file", "checkbox", "radio", "submit", "button", "reset", "image", "color", "date",
  "datetime-local", "month", "time", "week", "range"
]);

const BLOCKED_AUTOCOMPLETE = new Set([
  "current-password", "new-password", "one-time-code", "cc-name", "cc-given-name", "cc-additional-name", "cc-family-name",
  "cc-number", "cc-exp", "cc-exp-month", "cc-exp-year", "cc-csc", "cc-type", "transaction-currency", "transaction-amount"
]);

const SENSITIVE_PATTERNS = [
  /\bpass(word|code|phrase)?\b/,
  /\bpin\b/,
  /\botp\b/,
  /one[ -]?time[ -]?(code|pass(word)?)?/,
  /\b(2fa|mfa)\b/,
  /verification[ -]?code/,
  /security[ -]?(code|answer|question|token)/,
  /auth(entication)?[ -]?(code|token|secret)/,
  /access[ -]?token/,
  /api[ -]?(key|secret|token)/,
  /private[ -]?key/,
  /recovery[ -]?(code|phrase|key|seed)/,
  /seed[ -]?phrase/,
  /secret[ -]?(key|code|token|phrase)?/,
  /\bcvv2?\b/,
  /\bcvc2?\b/,
  /card[ -]?(number|no|num|security|verification|cvv|cvc|expiry|expiration)/,
  /credit[ -]?card/,
  /debit[ -]?card/,
  /account[ -]?(number|no|routing)/,
  /routing[ -]?(number|no)/,
  /social[ -]?security/,
  /\bssn\b/,
  /national[ -]?id/
];

function labelText(element: Element): string {
  const parts: string[] = [];
  if (element instanceof HTMLElement) {
    const explicitLabels = "labels" in element ? (element as HTMLInputElement).labels : null;
    explicitLabels?.forEach((label) => parts.push(label.textContent ?? ""));
    const parentLabel = element.closest("label");
    if (parentLabel) parts.push(parentLabel.textContent ?? "");
  }
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    for (const id of labelledBy.split(/\s+/)) {
      const labelledElement = document.getElementById(id);
      if (labelledElement) parts.push(labelledElement.textContent ?? "");
    }
  }
  return parts.join(" ");
}

export function sensitivitySignals(element: Element): string {
  const attributes = ["name", "id", "placeholder", "aria-label", "title", "data-testid"];
  const values = attributes.map((name) => element.getAttribute(name) ?? "");
  values.push(labelText(element));
  return normalizeText(values.join(" ").replace(/[_./:–—-]+/g, " "), 800);
}

export function isSensitiveField(element: Element): boolean {
  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase();
    if (BLOCKED_INPUT_TYPES.has(type)) return true;
    const autocomplete = normalizeText(element.autocomplete, 100).split(/\s+/);
    if (autocomplete.some((token) => BLOCKED_AUTOCOMPLETE.has(token))) return true;
  }

  const signals = sensitivitySignals(element);
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(signals));
}
