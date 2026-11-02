import { describe, expect, it, vi } from "vitest";
import { findEligibleFields, readFieldValue, writeFieldValue } from "../src/shared/fields";

describe("field handling", () => {
  it("finds multiple supported fields while excluding sensitive fields", () => {
    document.body.innerHTML = `
      <form><input name="subject"><textarea name="body"></textarea></form>
      <form><div contenteditable="true" aria-label="Notes"></div><input type="password"></form>`;
    expect(findEligibleFields()).toHaveLength(3);
  });

  it("reads and writes standard inputs as text and emits events", () => {
    document.body.innerHTML = '<textarea name="body"></textarea>';
    const textarea = document.querySelector("textarea")!;
    const input = vi.fn();
    const change = vi.fn();
    textarea.addEventListener("input", input);
    textarea.addEventListener("change", change);
    writeFieldValue(textarea, "<b>literal</b>");
    expect(readFieldValue(textarea)).toBe("<b>literal</b>");
    expect(input).toHaveBeenCalledOnce();
    expect(change).toHaveBeenCalledOnce();
  });

  it("writes contenteditable using textContent, not HTML", () => {
    document.body.innerHTML = '<div contenteditable="true"></div>';
    const editable = document.querySelector("div")!;
    writeFieldValue(editable, '<img src=x onerror="alert(1)">');
    expect(editable.querySelector("img")).toBeNull();
    expect(editable.textContent).toContain("<img");
  });
});
