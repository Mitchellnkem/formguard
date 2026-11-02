import { MAX_DRAFT_LENGTH, SAVE_DEBOUNCE_MS } from "../shared/constants";
import { findEligibleFields, isEligibleField, readFieldValue, writeFieldValue } from "../shared/fields";
import { identifyField } from "../shared/matching";
import { deleteDraft, getDraft, getSettings, isOriginEnabled, upsertDraft } from "../shared/storage";
import type { Draft, SupportedField } from "../shared/types";
import { debounce, hasMeaningfulText } from "../shared/utils";
import { showRecoveryControl, type RecoveryControl } from "./recovery-ui";

interface TrackedField {
  field: SupportedField;
  onInput: EventListener;
  save: (() => void) & { cancel: () => void };
  recovery?: RecoveryControl;
}

export class DraftManager {
  private tracked = new Map<SupportedField, TrackedField>();
  private observer?: MutationObserver;
  private active = false;
  private route = `${location.origin}${location.pathname}`;

  async start(): Promise<void> {
    this.active = await isOriginEnabled(location.origin);
    if (!this.active) return;
    await this.scan(document);
    this.observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) void this.scan(node);
        }
      }
      this.removeDetachedFields();
    });
    this.observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("popstate", this.handlePossibleRouteChange);
    window.addEventListener("hashchange", this.handlePossibleRouteChange);
    this.patchHistory();
  }

  stop(): void {
    this.active = false;
    this.observer?.disconnect();
    this.observer = undefined;
    window.removeEventListener("popstate", this.handlePossibleRouteChange);
    window.removeEventListener("hashchange", this.handlePossibleRouteChange);
    for (const tracked of this.tracked.values()) this.untrack(tracked);
    this.tracked.clear();
  }

  private patchHistory(): void {
    for (const method of ["pushState", "replaceState"] as const) {
      const original = history[method].bind(history);
      history[method] = ((...args: Parameters<History[typeof method]>) => {
        const result = original(...args);
        queueMicrotask(this.handlePossibleRouteChange);
        return result;
      }) as History[typeof method];
    }
  }

  private handlePossibleRouteChange = (): void => {
    const nextRoute = `${location.origin}${location.pathname}`;
    if (nextRoute === this.route) return;
    this.route = nextRoute;
    for (const tracked of this.tracked.values()) this.untrack(tracked);
    this.tracked.clear();
    void this.scan(document);
  };

  private async scan(root: ParentNode): Promise<void> {
    if (!this.active) return;
    const candidates = root instanceof Element && isEligibleField(root)
      ? [root, ...findEligibleFields(root)]
      : findEligibleFields(root);
    for (const field of candidates) {
      if (!this.tracked.has(field)) await this.track(field);
    }
  }

  private async track(field: SupportedField): Promise<void> {
    const identity = await identifyField(field);
    if (!this.active || !field.isConnected || !isEligibleField(field)) return;
    const save = debounce(() => void this.saveField(field), SAVE_DEBOUNCE_MS);
    const onInput: EventListener = () => save();
    const tracked: TrackedField = { field, onInput, save };
    this.tracked.set(field, tracked);
    field.addEventListener("input", onInput);

    const draft = await getDraft(identity.id);
    if (!draft || !field.isConnected || this.tracked.get(field) !== tracked) return;
    const current = readFieldValue(field);
    if (hasMeaningfulText(current)) return;
    tracked.recovery = showRecoveryControl(
      field,
      draft,
      () => void this.restoreDraft(tracked, draft),
      () => void this.removeDraft(tracked, draft.id)
    );
  }

  private async saveField(field: SupportedField): Promise<void> {
    if (!this.active || !field.isConnected || !isEligibleField(field)) return;
    const identity = await identifyField(field);
    const value = readFieldValue(field).slice(0, MAX_DRAFT_LENGTH);
    if (!hasMeaningfulText(value)) {
      await deleteDraft(identity.id);
      return;
    }
    const settings = await getSettings();
    const existing = await getDraft(identity.id);
    const now = Date.now();
    const draft: Draft = {
      ...identity,
      value,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      expiresAt: now + settings.retentionDays * 24 * 60 * 60 * 1000
    };
    await upsertDraft(draft);
    const tracked = this.tracked.get(field);
    tracked?.recovery?.remove();
    if (tracked) tracked.recovery = undefined;
  }

  private async restoreDraft(tracked: TrackedField, draft: Draft): Promise<void> {
    const current = readFieldValue(tracked.field);
    if (hasMeaningfulText(current) && current !== draft.value) return;
    tracked.save.cancel();
    tracked.field.removeEventListener("input", tracked.onInput);
    writeFieldValue(tracked.field, draft.value);
    tracked.field.addEventListener("input", tracked.onInput);
    await deleteDraft(draft.id);
    tracked.recovery?.remove();
    tracked.recovery = undefined;
    tracked.field.focus();
  }

  private async removeDraft(tracked: TrackedField, id: string): Promise<void> {
    await deleteDraft(id);
    tracked.recovery?.remove();
    tracked.recovery = undefined;
  }

  private removeDetachedFields(): void {
    for (const [field, tracked] of this.tracked) {
      if (!field.isConnected) {
        this.untrack(tracked);
        this.tracked.delete(field);
      }
    }
  }

  private untrack(tracked: TrackedField): void {
    tracked.save.cancel();
    tracked.field.removeEventListener("input", tracked.onInput);
    tracked.recovery?.remove();
  }
}
