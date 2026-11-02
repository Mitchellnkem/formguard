import { describe, expect, it } from "vitest";
import { detectFields } from "../src/field-detector";
import { isEligibleField, isSensitiveField } from "../src/security";

function element(html: string): Element {
  document.body.innerHTML = html;
  return document.body.firstElementChild!;
}

describe("field eligibility", () => {
  it.each([
    ["standard text", '<input type="text" name="message">'],
    ["textarea", '<textarea name="notes"></textarea>'],
    ["search", '<input type="search" name="query">'],
    ["contenteditable", '<div contenteditable="true" aria-label="Article"></div>']
  ])("accepts %s", (_name, html) => expect(isEligibleField(element(html))).toBe(true));

  it.each([
    ["password", '<input type="password" name="password">'],
    ["hidden", '<input type="hidden" name="notes">'],
    ["OTP autocomplete", '<input type="text" autocomplete="one-time-code">'],
    ["PIN name", '<input type="text" name="account_pin">'],
    ["card number", '<input type="text" aria-label="Credit card number">'],
    ["CVV placeholder", '<input type="text" placeholder="CVV">'],
    ["authentication token", '<textarea id="access_token"></textarea>'],
    ["labelled secret", '<label>Recovery code <input type="text"></label>'],
    ["ARIA secret", '<input type="text" aria-label="API key">'],
    ["disabled", '<textarea disabled></textarea>'],
    ["read only", '<input type="text" readonly>'],
    ["aria hidden", '<textarea aria-hidden="true"></textarea>']
  ])("rejects %s", (_name, html) => expect(isEligibleField(element(html))).toBe(false));

  it("uses associated labels as a sensitivity signal", () => {
    document.body.innerHTML = '<label for="code">Security code</label><input id="code" type="text">';
    expect(isSensitiveField(document.querySelector("input")!)).toBe(true);
  });

  it("detects several eligible fields while excluding sensitive ones", () => {
    document.body.innerHTML = `
      <form><input name="title"><textarea name="body"></textarea><input type="password"></form>
      <form><div contenteditable="true" aria-label="Comment"></div><input name="otp_code"></form>`;
    expect(detectFields()).toHaveLength(3);
  });
});
