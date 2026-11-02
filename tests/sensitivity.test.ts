import { describe, expect, it } from "vitest";
import { isEligibleField } from "../src/shared/fields";
import { isSensitiveField } from "../src/shared/sensitivity";

function field(markup: string): Element {
  document.body.innerHTML = markup;
  const result = document.body.lastElementChild;
  if (!result) throw new Error("Fixture did not create an element");
  return result;
}

describe("sensitive-field detection", () => {
  it.each([
    '<input type="password" name="login_password">',
    '<input type="hidden" name="secret">',
    '<input type="text" autocomplete="one-time-code">',
    '<input type="text" name="otp">',
    '<input type="text" id="account-pin">',
    '<input type="text" placeholder="CVV">',
    '<input type="text" aria-label="Card number">',
    '<input type="text" name="credit_card_expiry">',
    '<input type="text" name="api_key">',
    '<input type="text" name="recovery_seed">',
    '<input type="text" aria-label="Social security number">',
    '<textarea name="auth_token"></textarea>'
  ])("rejects %s", (markup) => {
    const element = field(markup);
    expect(isSensitiveField(element)).toBe(true);
    expect(isEligibleField(element)).toBe(false);
  });

  it("uses associated label text as a signal", () => {
    document.body.innerHTML = '<label for="code">Security code</label><input id="code" type="text">';
    expect(isSensitiveField(document.querySelector("input")!)).toBe(true);
  });

  it.each([
    '<input type="text" name="title">',
    '<input type="email" name="contact_email">',
    '<input type="search" aria-label="Search articles">',
    '<textarea name="article_body"></textarea>',
    '<div contenteditable="true" aria-label="Notes"></div>'
  ])("allows ordinary supported fields: %s", (markup) => {
    expect(isEligibleField(field(markup))).toBe(true);
  });

  it("rejects unsupported and opted-out elements", () => {
    expect(isEligibleField(field('<input type="number" name="quantity">'))).toBe(false);
    expect(isEligibleField(field('<textarea data-formguard="off"></textarea>'))).toBe(false);
    expect(isEligibleField(field('<input type="text" readonly>'))).toBe(false);
  });
});
