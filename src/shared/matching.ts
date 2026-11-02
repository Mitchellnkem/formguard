import { MATCH_VERSION } from "./constants";
import { fieldDisplayLabel, findEligibleFields } from "./fields";
import type { FieldIdentity, SupportedField } from "./types";
import { normalizeText, safePageLocation } from "./utils";

function safeActionPath(form: HTMLFormElement): string {
  const raw = form.getAttribute("action");
  if (!raw) return "";
  try {
    const url = new URL(raw, location.href);
    return url.origin === location.origin ? url.pathname : "cross-origin";
  } catch {
    return "invalid";
  }
}

function formFingerprint(field: SupportedField): string {
  const form = field.closest("form");
  if (!form) return "no-form";
  const forms = Array.from(document.forms);
  return [
    normalizeText(form.id),
    normalizeText(form.getAttribute("name") ?? ""),
    normalizeText(safeActionPath(form)),
    String(forms.indexOf(form))
  ].join("|");
}

function fieldFingerprint(field: SupportedField): string {
  const formOrDocument: ParentNode = field.closest("form") ?? document;
  const eligible = findEligibleFields(formOrDocument);
  const type = field instanceof HTMLInputElement ? field.type : field instanceof HTMLTextAreaElement ? "textarea" : "contenteditable";
  return [
    normalizeText(field.id),
    normalizeText(field.getAttribute("name") ?? ""),
    normalizeText(fieldDisplayLabel(field)),
    type,
    String(eligible.indexOf(field))
  ].join("|");
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function identifyField(field: SupportedField): Promise<FieldIdentity> {
  const page = safePageLocation(location);
  const descriptor = [MATCH_VERSION, page.origin, page.pathname, formFingerprint(field), fieldFingerprint(field)].join("\n");
  return {
    id: await sha256(descriptor),
    origin: page.origin,
    pathname: page.pathname,
    fieldLabel: fieldDisplayLabel(field)
  };
}
