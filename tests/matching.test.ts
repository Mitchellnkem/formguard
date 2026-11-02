import { describe, expect, it } from "vitest";
import { identifyField } from "../src/shared/matching";

describe("draft identification", () => {
  it("is stable for the same field and ignores query strings and fragments", async () => {
    history.replaceState(null, "", "/compose?token=secret#private");
    document.body.innerHTML = '<form id="compose"><label>Message<textarea name="message"></textarea></label></form>';
    const textarea = document.querySelector("textarea")!;
    const first = await identifyField(textarea);
    history.replaceState(null, "", "/compose?token=other#changed");
    const second = await identifyField(textarea);
    expect(second.id).toBe(first.id);
    expect(first.pathname).toBe("/compose");
    expect(JSON.stringify(first)).not.toContain("secret");
    expect(JSON.stringify(first)).not.toContain("private");
  });

  it("distinguishes fields and forms", async () => {
    document.body.innerHTML = `
      <form id="one"><textarea name="message"></textarea><textarea name="message"></textarea></form>
      <form id="two"><textarea name="message"></textarea></form>`;
    const identities = await Promise.all(Array.from(document.querySelectorAll("textarea"), identifyField));
    expect(new Set(identities.map((item) => item.id)).size).toBe(3);
  });
});
