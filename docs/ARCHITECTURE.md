# FormGuard V0.1 Architecture and Security Plan

## Product boundary

FormGuard is a local-only Chrome/Chromium Manifest V3 extension. It observes supported editable fields, rejects fields that appear sensitive, debounces local draft writes, and offers explicit Restore or Delete controls when the same page and field are seen again. It has no backend, accounts, analytics, remote code, or network requests.

## Module layout

```text
src/
  content/                 field discovery, event handling, recovery UI
  popup/                   current-site status and draft count
  options/                 settings and draft management
  shared/                  types, sensitivity, matching, storage, utilities
static/                    HTML and CSS copied into the build
tests/                     unit/security tests and manual test fixtures
docs/                      threat model, checklists, privacy and release docs
scripts/                   small build/package scripts
dist/                      generated unpacked extension
```

The content script is the only component that reads page fields. Popup and options code only read extension storage. Three entry points are bundled separately so browser pages never execute extension code with page privileges.

## Draft identification

A draft key is a SHA-256 digest of a versioned descriptor containing:

- the page origin;
- the normalized pathname (query parameters and fragments are never retained);
- a form fingerprint derived from stable `id`, `name`, safe action pathname, and local form index;
- a field fingerprint derived from stable `id`, `name`, label/ARIA text, supported type, and its index among eligible fields.

The descriptor uses normalized, length-limited strings. The stored draft includes enough non-secret metadata for management (origin, pathname, a human-readable field label, timestamps), but does not store the raw descriptor. Duplicate tabs intentionally share a key. SPA route changes are detected and fields are rescanned. Matching is conservative: changing the origin, pathname, form fingerprint, or field fingerprint produces a different key.

## Sensitive-field strategy

Eligibility is allow-list based. Supported inputs are `text`, `search`, `email`, `url`, and `tel`, plus `textarea` and explicitly contenteditable elements. Disabled, read-only, hidden, non-rendered, or opt-out fields are rejected.

Sensitivity uses multiple normalized signals: input type, autocomplete tokens, name, id, label text, placeholder, title, and ARIA metadata. Password/hidden fields and autocomplete tokens for credentials, payment details, one-time codes, and transaction data are always rejected. Conservative patterns reject card/CVV/PIN/OTP/security-code/authentication/secret/recovery fields. Ambiguous signals are rejected; there is no user override in V0.1.

Page-controlled text is only ever handled as text (`value` or `textContent`), never as HTML. Draft values are never placed in popup/options markup using `innerHTML`.

## Permissions

- `storage`: required for settings and drafts in `chrome.storage.local`.
- `host_permissions: <all_urls>` and a declarative content script match: required to protect forms on sites the user visits. Chrome-restricted pages and extension stores remain inaccessible by platform design.

No `tabs`, browsing history, cookies, web request, clipboard, identity, scripting, alarms, or network permissions are requested.

## Threat model

### Data handled

Eligible unfinished text; origin and query-free pathname; conservative form/field labels and fingerprints; creation/update/expiry timestamps; disabled-site settings.

### Data refused

Passwords, hidden values, OTPs, PINs, payment/card data, security answers/codes, authentication secrets, fields with suspicious metadata, and unsupported controls.

### Storage

Drafts remain in `chrome.storage.local` inside the browser profile. They are not encrypted by FormGuard because an extension cannot safely keep a decryption key from a user-level attacker in the same profile. Drafts expire after the configured retention period and can be deleted individually or all at once.

### Attack surfaces and mitigations

- **Malicious pages:** pages can craft misleading fields or mutate the DOM. The allow-list and conservative sensitivity classifier run before every save; MutationObserver rescans only candidates; extension UI uses an isolated world and text-only DOM APIs.
- **Page script impersonation:** recovery controls live in a shadow root. A page can visually imitate them but cannot access extension storage or the isolated-world listeners.
- **Extension XSS:** the extension has a restrictive CSP, no remote scripts, no eval, no inline script, and no HTML injection of stored/page data.
- **Overbroad capture:** unsupported or uncertain fields fail closed. Values below the meaningful-text threshold are removed instead of retained.
- **URL leakage:** queries, fragments, usernames, and passwords are excluded; only origin and normalized pathname are stored.
- **Storage disclosure:** anyone with access to the unlocked browser profile or another extension with a browser vulnerability may read local data. The UI states this limitation, retention is bounded, and deletion is available.
- **Storage exhaustion:** writes are debounced, values and metadata are length-limited, stale drafts are cleaned on storage activity, and oldest drafts are evicted when the cap is reached.
- **Stale/incorrect restore:** restoration is explicit, requires a matching key, and is refused when a field already contains meaningful text different from the draft.

## Important platform limitations

- Chrome internal pages, the Chrome Web Store, some PDF viewers, and other protected surfaces do not allow content scripts.
- Cross-origin frames require matching host access and are intentionally not enabled with `all_frames` in V0.1.
- Closed shadow roots and editor canvases cannot be inspected. Complex rich-text editors may not behave like standard contenteditable elements.
- File URLs require the user to enable file access manually; incognito requires explicit user permission and uses browser-defined storage behavior.
- Site markup changes can change a fingerprint and leave an older draft visible only in Manage Drafts.
- Local storage is not end-to-end encrypted and does not survive profile deletion or guaranteed browser-data cleanup.
- FormGuard cannot prevent all data loss; pages may replace fields before an input event or block extension execution.

## MVP acceptance criteria

1. Eligible text inputs, textareas, and reliable contenteditable elements autosave after a debounce.
2. Password, hidden, OTP, PIN, card, CVV, authentication-secret, and suspicious fields never produce drafts in mandatory tests.
3. Draft metadata contains no query string or fragment and no network request is made.
4. A matching empty field shows explicit Restore/Delete controls; meaningful existing content is never silently replaced.
5. Popup reports active/disabled state and count; the current origin can be disabled or enabled.
6. Options UI lists, individually deletes, clears, and expires drafts.
7. Dynamic fields and practical SPA navigation are rescanned without duplicate listeners.
8. Strict type checking, automated unit/security tests, and a production build pass.
9. README, privacy/security/testing/release docs, packaging instructions, known limitations, and V0.2 backlog are present.

