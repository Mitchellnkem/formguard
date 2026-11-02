import { getFieldLabel, type SupportedField } from "./security";
import { deleteDraft, getDraft, saveDraft } from "./storage";
import {
  MAX_DRAFT_LENGTH,
  getPageIdentity,
  stableHash,
  type DraftRecord,
  type PageIdentity
} from "./utils";

function elementIndex(element: Element, selector: string): number {
  return Array.from(element.ownerDocument.querySelectorAll(selector)).indexOf(element);
}

function safeAction(form: HTMLFormElement): string {
  if (!form.action) return "";
  try {
    const url = new URL(form.action, location.href);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}

export function getFormFingerprint(field: Element): string {
  const form = field.closest("form");
  if (!form) return `no-form:${elementIndex(field, "input,textarea,[contenteditable]")}`;
  const identity = [
    form.id,
    form.getAttribute("name") ?? "",
    safeAction(form),
    form.method,
    elementIndex(form, "form").toString()
  ].join("|");
  return stableHash(identity);
}

export function getFieldFingerprint(field: SupportedField): string {
  const form = field.closest("form");
  const scope = form ?? field.ownerDocument;
  const fields = Array.from(scope.querySelectorAll("input,textarea,[contenteditable]"));
  const tag = field.tagName.toLowerCase();
  const identity = [
    tag,
    field.id,
    field.getAttribute("name") ?? "",
    field.getAttribute("autocomplete") ?? "",
    field.getAttribute("aria-label") ?? "",
    fields.indexOf(field).toString()
  ].join("|");
  return stableHash(identity);
}

export function createDraftId(page: PageIdentity, formFingerprint: string, fieldFingerprint: string): string {
  return stableHash(`${page.origin}|${page.pathname}|${formFingerprint}|${fieldFingerprint}`);
}

export function identityForField(field: SupportedField, locationLike: Location = location): {
  id: string;
  page: PageIdentity;
  formFingerprint: string;
  fieldFingerprint: string;
} {
  const page = getPageIdentity(locationLike);
  const formFingerprint = getFormFingerprint(field);
  const fieldFingerprint = getFieldFingerprint(field);
  return {
    id: createDraftId(page, formFingerprint, fieldFingerprint),
    page,
    formFingerprint,
    fieldFingerprint
  };
}

export async function persistFieldDraft(
  field: SupportedField,
  content: string,
  retentionDays: number,
  now = Date.now(),
  locationLike: Location = location
): Promise<DraftRecord | undefined> {
  const identity = identityForField(field, locationLike);
  const trimmed = content.trim();
  if (!trimmed) {
    await deleteDraft(identity.id);
    return undefined;
  }
  const existing = await getDraft(identity.id);
  const draft: DraftRecord = {
    id: identity.id,
    origin: identity.page.origin,
    pathname: identity.page.pathname,
    hostname: identity.page.hostname,
    formFingerprint: identity.formFingerprint,
    fieldFingerprint: identity.fieldFingerprint,
    fieldLabel: getFieldLabel(field),
    content: content.slice(0, MAX_DRAFT_LENGTH),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    expiresAt: now + retentionDays * 86_400_000
  };
  await saveDraft(draft);
  return draft;
}

export async function findDraftForField(
  field: SupportedField,
  locationLike: Location = location
): Promise<DraftRecord | undefined> {
  return getDraft(identityForField(field, locationLike).id);
}

export async function deleteDraftForField(field: SupportedField, locationLike: Location = location): Promise<void> {
  await deleteDraft(identityForField(field, locationLike).id);
}
