# FormGuard privacy policy draft

**Effective date:** [INSERT DATE]

FormGuard helps recover unfinished writing in supported website form fields.

## Information stored

FormGuard may store eligible unfinished text, the website hostname and query-free page path where it was typed, a short field description, form/field fingerprints, and save/expiration timestamps. Settings such as excluded websites and retention period are also stored.

## Information excluded

FormGuard is designed not to save password fields, hidden fields, payment-card data, CVV/CVC, PINs, one-time codes, obvious authentication secrets, or fields its conservative checks classify as sensitive. Automated classification cannot be guaranteed on every website; users should not type secrets into ordinary text fields.

## Storage and transmission

Data is stored locally in the browser profile using `chrome.storage.local`. FormGuard V0.1 has no account, backend, cloud synchronization, analytics, advertising, or telemetry, and does not send draft contents to external servers. Local browser storage is not separately encrypted by FormGuard.

## Retention and deletion

Drafts expire automatically after the configured retention period (14 days by default). Cleanup occurs when the extension runs. Users can delete a draft, clear all drafts, disable a website, or disable FormGuard from the extension interface. Removing the extension normally removes its local extension storage according to browser behavior.

## Permissions

FormGuard uses the browser storage permission and runs a content script on ordinary HTTP and HTTPS pages so it can detect and protect eligible fields. It does not request cookies, history, identity, clipboard, or browsing-tab permissions.

## Security

FormGuard minimizes stored metadata, excludes URL queries/fragments, uses text-only rendering for untrusted content, and contains no remote executable code. No software can eliminate every risk, especially on a compromised device or browser profile.

## Changes and contact

Material changes will be reflected in an updated policy and effective date. Questions: [INSERT CONTACT EMAIL OR WEBSITE].

> This is a product draft, not legal advice. Review it for applicable jurisdictions and Chrome Web Store disclosure requirements before publication.
