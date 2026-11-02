import { describe, expect, it } from "vitest";
import { createDraftId, getFieldFingerprint, getFormFingerprint, persistFieldDraft } from "../src/draft-manager";
import { getAllDrafts } from "../src/storage";
import { getPageIdentity } from "../src/utils";

function fakeLocation(pathname: string, hostname = "example.com"): Location {
  return { origin: `https://${hostname}`, pathname, hostname } as Location;
}

describe("draft identification and persistence", () => {
  it("omits URL queries and fragments from page identity", () => {
    const identity = getPageIdentity(fakeLocation("/compose/"));
    expect(identity).toEqual({ origin: "https://example.com", pathname: "/compose", hostname: "example.com" });
    expect(createDraftId(identity, "form", "field")).toBe(createDraftId(identity, "form", "field"));
  });

  it("distinguishes multiple forms and fields", () => {
    document.body.innerHTML = `
      <form id="first"><input name="title"><textarea name="body"></textarea></form>
      <form id="second"><textarea name="body"></textarea></form>`;
    const [title, bodyOne, bodyTwo] = Array.from(document.querySelectorAll("input,textarea"));
    expect(getFormFingerprint(title!)).not.toBe(getFormFingerprint(bodyTwo!));
    expect(getFieldFingerprint(title! as HTMLInputElement)).not.toBe(getFieldFingerprint(bodyOne! as HTMLTextAreaElement));
  });

  it("updates a draft without changing its creation time", async () => {
    document.body.innerHTML = '<form id="editor"><textarea name="body"></textarea></form>';
    const field = document.querySelector("textarea")!;
    const first = await persistFieldDraft(field, "first", 14, 1_000, fakeLocation("/write"));
    const second = await persistFieldDraft(field, "second", 14, 2_000, fakeLocation("/write"));
    expect(first?.createdAt).toBe(1_000);
    expect(second).toMatchObject({ content: "second", createdAt: 1_000, updatedAt: 2_000 });
    expect(await getAllDrafts()).toHaveLength(1);
  });

  it("deletes the draft when the field becomes empty", async () => {
    document.body.innerHTML = '<textarea name="body"></textarea>';
    const field = document.querySelector("textarea")!;
    await persistFieldDraft(field, "unfinished", 14, 1_000, fakeLocation("/write"));
    await persistFieldDraft(field, "   ", 14, 2_000, fakeLocation("/write"));
    expect(await getAllDrafts()).toEqual([]);
  });

  it("stores only origin and pathname metadata", async () => {
    document.body.innerHTML = '<textarea name="body"></textarea>';
    const field = document.querySelector("textarea")!;
    const draft = await persistFieldDraft(field, "hello", 7, 1_000, fakeLocation("/compose"));
    expect(draft).toMatchObject({ origin: "https://example.com", pathname: "/compose", hostname: "example.com" });
    expect(JSON.stringify(draft)).not.toContain("?");
    expect(draft?.expiresAt).toBe(1_000 + 7 * 86_400_000);
  });
});
