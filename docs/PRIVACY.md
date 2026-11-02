# FormGuard Privacy Policy Draft

Effective date: 2 November 2026

FormGuard helps recover unfinished text entered into supported web form fields.

## Data FormGuard processes

FormGuard may store eligible unfinished text, the website origin and URL path (without query parameters or fragments), a limited field label, a non-reversible matching identifier, and timestamps. It also stores the websites on which the user disabled FormGuard and the selected retention period.

FormGuard is designed not to store passwords, hidden fields, payment-card details, CVV/CVC codes, PINs, one-time codes, obvious authentication secrets, or fields whose metadata appears sensitive. Automated classification cannot be guaranteed perfect, so users should not enter sensitive information into ordinary text fields while FormGuard is active.

## Storage and sharing

All FormGuard data is stored in `chrome.storage.local` in the user's browser profile. FormGuard has no backend and does not transmit, sell, share, or use draft content for advertising or analytics. FormGuard does not include telemetry or remote executable code.

Draft storage is not encrypted by FormGuard. Anyone with access to the unlocked browser profile, or software capable of reading that profile, may be able to access stored drafts.

## Retention and control

Drafts expire automatically according to the selected retention period (7 days by default). Users can delete individual drafts, clear all drafts, disable FormGuard for a website, or remove the extension. Browser removal and profile cleanup are controlled by the browser.

## Permissions

FormGuard uses the Chrome `storage` permission to keep drafts and settings locally. It requests access to websites so its content script can recognize eligible form fields and show recovery controls. It does not request browsing history, cookies, identity, clipboard, web-request, or network permissions.

## Changes and contact

Material changes to this policy should be published with a new effective date. Before release, replace this paragraph with the publisher's support email and legal entity/contact details.

> Release note: this is a product draft, not legal advice. The publisher should review it for the jurisdictions and store policies that apply.
