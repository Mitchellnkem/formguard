# Threat model and security checklist

## Data handled

FormGuard handles text typed into eligible text inputs, textareas, and conservative contenteditable elements. It stores the text, timestamps, a short field label, hostname, origin, normalized pathname, and hashed form/field fingerprints. It does not store URL queries or fragments.

It refuses password and hidden inputs; card/payment data; CVV/CVC; PIN, OTP, MFA, and verification codes; authentication secrets; tokens and API/private keys; government identifiers detected by obvious signals; disabled/read-only/hidden fields; and any unsupported or suspicious field.

Drafts and settings reside in `chrome.storage.local` in the user's Chromium profile. Nothing is transmitted by FormGuard.

## Attack surfaces and mitigations

| Risk | Mitigation |
|---|---|
| A malicious or poorly labeled page disguises a sensitive field | Multiple independent signals are checked. Known sensitive input types and autocomplete tokens are denied. Suspicious metadata is denied conservatively. |
| Stored text causes extension XSS | Saved and page-controlled strings are assigned with `textContent`; no `innerHTML`, `eval`, inline script, or remote executable code is used. |
| Page CSS/scripts spoof or alter recovery UI | The prompt uses a closed shadow root and extension-owned event handlers. Users should still verify the field before restoring. |
| Draft overwrites current writing | Restoration is always user-triggered. Different non-empty content requires a second explicit replace confirmation. |
| URL identifiers or secrets leak into storage | Only origin and normalized pathname are retained; query and fragment are excluded, including from form action metadata. |
| Stale drafts increase exposure | Default 14-day expiration, automatic opportunistic cleanup, individual deletion, and clear-all are provided. |
| Storage exhaustion | Saves are debounced, empty drafts are removed, and each field is capped at 200,000 characters. Browser quota errors are caught. |
| Other extensions, malware, or local profile access reads drafts | The policy states local plaintext risk clearly. FormGuard requests minimal permissions and cannot defend a compromised browser/profile. |
| Fingerprint collision or DOM changes match the wrong field | Origin/path/form/field signals are combined. Recovery is offered, never automatic; existing text is protected. |
| Extension compromise through dependencies | Runtime bundles have no third-party runtime libraries or remote code. Lockfiles and build dependencies should be reviewed on release. |

## Release security checklist

- [ ] `npm run typecheck`, `npm test`, and `npm run build` pass from a clean checkout.
- [ ] Test every mandatory denied field in `tests/security.test.ts` and the manual checklist.
- [ ] Search built output for `eval`, remote URLs, dynamic script creation, `innerHTML`, and unexpected network APIs.
- [ ] Confirm manifest permissions remain limited to `storage` plus HTTP(S) content-script matches.
- [ ] Inspect `npm audit` results and pin the release lockfile.
- [ ] Verify popup/options/page UI uses text-only insertion for untrusted values.
- [ ] Verify replacement confirmation protects non-empty fields.
- [ ] Verify query strings and fragments never appear in stored records.
- [ ] Verify expiry, individual deletion, clear-all, and site exclusion.
- [ ] Review the privacy policy and store disclosure against the shipped code.
