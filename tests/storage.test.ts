import { describe, expect, it } from "vitest";
import { cleanupExpiredDrafts, getAllDrafts, getSettings, saveDraft, saveSettings } from "../src/storage";
import type { DraftRecord } from "../src/utils";

function draft(id: string, expiresAt: number): DraftRecord {
  return {
    id, origin: "https://example.com", pathname: "/", hostname: "example.com",
    formFingerprint: "form", fieldFingerprint: id, fieldLabel: "Message", content: "draft",
    createdAt: 1, updatedAt: 1, expiresAt
  };
}

describe("storage", () => {
  it("cleans up only expired drafts", async () => {
    await saveDraft(draft("old", 99));
    await saveDraft(draft("new", 101));
    expect(await cleanupExpiredDrafts(100)).toBe(1);
    expect((await getAllDrafts()).map((item) => item.id)).toEqual(["new"]);
  });

  it("normalizes and clamps settings", async () => {
    await saveSettings({ enabled: true, excludedHosts: ["EXAMPLE.COM", "example.com"], retentionDays: 500 });
    expect(await getSettings()).toEqual({ enabled: true, excludedHosts: ["example.com"], retentionDays: 90 });
  });
});
