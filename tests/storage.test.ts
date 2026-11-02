import { describe, expect, it } from "vitest";
import { MAX_DRAFTS, STORAGE_KEYS } from "../src/shared/constants";
import { clearDrafts, deleteDraft, getDrafts, getSettings, setOriginEnabled, upsertDraft } from "../src/shared/storage";
import type { Draft } from "../src/shared/types";

function draft(id: string, updatedAt: number, expiresAt = updatedAt + 10_000): Draft {
  return { id, value: `value-${id}`, origin: "https://example.test", pathname: "/write", fieldLabel: "Body", createdAt: updatedAt, updatedAt, expiresAt };
}

describe("draft storage", () => {
  it("upserts and deletes individual drafts", async () => {
    await upsertDraft(draft("a", 100));
    await upsertDraft(draft("b", 200));
    expect((await getDrafts(0)).map((item) => item.id)).toEqual(["b", "a"]);
    await deleteDraft("b");
    expect((await getDrafts(0)).map((item) => item.id)).toEqual(["a"]);
    await clearDrafts();
    expect(await getDrafts(0)).toEqual([]);
  });

  it("removes expired and malformed records", async () => {
    await chrome.storage.local.set({ [STORAGE_KEYS.drafts]: [draft("old", 10, 20), draft("new", 90, 200), { id: "bad" }] });
    expect((await getDrafts(100)).map((item) => item.id)).toEqual(["new"]);
  });

  it("caps storage at the newest records", async () => {
    for (let index = 0; index < MAX_DRAFTS + 3; index += 1) await upsertDraft(draft(String(index), index));
    const drafts = await getDrafts(0);
    expect(drafts).toHaveLength(MAX_DRAFTS);
    expect(drafts[0]?.id).toBe(String(MAX_DRAFTS + 2));
  });

  it("tracks disabled origins without duplicates", async () => {
    await setOriginEnabled("https://example.test", false);
    await setOriginEnabled("https://example.test", false);
    expect((await getSettings()).disabledOrigins).toEqual(["https://example.test"]);
    await setOriginEnabled("https://example.test", true);
    expect((await getSettings()).disabledOrigins).toEqual([]);
  });
});
