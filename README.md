# FormGuard

**Never lose what you were typing again.**

FormGuard is a small, privacy-focused Chrome/Chromium Manifest V3 extension. It saves eligible unfinished form text to `chrome.storage.local` and offers to restore it when the same page, form, and field return. It has no backend, account, telemetry, remote code, or network requests.

## V0.1 architecture

- `src/content.ts` coordinates field discovery, debounced input handling, recovery UI, form submission cleanup, dynamic DOM observation, and practical SPA route detection.
- `src/field-detector.ts` discovers supported inputs, textareas, and reliable contenteditable elements and safely reads/writes their text.
- `src/security.ts` rejects sensitive or ambiguous fields using type, autocomplete, name, ID, label, placeholder, title, test ID, and ARIA signals.
- `src/draft-manager.ts` creates page/form/field fingerprints and constructs draft records.
- `src/storage.ts` is the only persistence boundary. Drafts use individual prefixed keys in `chrome.storage.local`.
- `popup/` shows protection state, local draft count, site exclusion controls, and a link to management.
- `options/` manages retention, site exclusions, individual deletion, and clearing all drafts.
- `src/utils.ts` contains shared strict types and small deterministic helpers.

### Draft identification

A draft ID is a deterministic hash of:

1. Lowercase page origin and normalized pathname. Query parameters and fragments are never stored or included.
2. A form fingerprint based on form ID/name, query-free action path, method, and document index.
3. A field fingerprint based on tag, ID/name, autocomplete/ARIA label, and index within its form.

This is deliberately practical rather than magical. It separates common fields without retaining selectors or sensitive URLs. A significant website redesign can make an old draft no longer match; users can still delete it in Options.

### Permissions

- `storage`: required for local settings and drafts.
- `http://*/*` and `https://*/*` content-script matches: required to protect forms on ordinary websites. There is no host API access or outgoing network code.

No `tabs`, cookies, browsing history, identity, clipboard, or background permissions are requested. Chrome-restricted pages are unavailable by platform design.

## Build

Requirements: a supported Node.js release (22.12+, 24.x, or 26+) and npm.

```sh
npm install
npm run typecheck
npm test
npm run build
```

The loadable extension is generated in `dist/`. The build script bundles TypeScript, copies static assets, and generates local PNG icons without downloading runtime resources.

For TypeScript watch mode:

```sh
npm run dev
```

Static HTML/CSS changes require restarting the build command.

## Install for development

1. Run `npm install` and `npm run build`.
2. Open `chrome://extensions` (or the equivalent Chromium extensions page).
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select the `formguard/dist` directory.
5. Open a normal HTTP(S) page with a non-sensitive textarea, type text, wait at least one second, and refresh.
6. After rebuilding, click **Reload** on the extension card and refresh any test page.

## Behavior

- Saving is debounced by 700 ms.
- Whitespace-only content removes that field's draft.
- Successful form submission removes drafts for fields in that form.
- A recovery prompt never restores automatically. If a field already contains different meaningful text, the first Restore click changes to a second explicit “Replace current text?” confirmation.
- Drafts expire after 14 days by default (configurable from 1–90 days). Cleanup runs when FormGuard initializes or its management UI opens.
- Draft content is capped at 200,000 characters per field to reduce accidental storage exhaustion.

## Documentation

- [Threat model and security checklist](SECURITY.md)
- [Testing checklist](TESTING.md)
- [Privacy policy draft](PRIVACY.md)
- [Release and packaging checklist](RELEASE.md)

## Known limitations

- A crash inside the 700 ms debounce window can lose the most recent change.
- `chrome.storage.local` is local profile storage, not FormGuard-provided encryption. Anyone or malware with access to the unlocked browser profile may access it.
- Browser-internal pages, extension stores, PDFs, sandboxed/cross-origin frames, and other restricted surfaces cannot be protected.
- Rich editors with virtual document models, canvas rendering, or unusual event handling may not work reliably. Contenteditable support is intentionally conservative.
- Duplicate tabs for the same normalized page/form/field share one latest draft.
- Fingerprints are best-effort. Major DOM changes can prevent automatic matching; identical repeated unnamed fields may be ambiguous.
- FormGuard cannot know that an AJAX-based form submission succeeded unless the page clears the field; ordinary form `submit` events are handled.
- Storage quota or browser policy failures can prevent saving. FormGuard logs a generic warning without draft contents.

## Suggested V0.2 backlog

1. User-visible storage quota health and per-site storage totals.
2. A page-level recovery drawer for unmatched drafts, with cautious manual targeting.
3. Better support for well-known rich-text editors through audited adapters.
4. Configurable per-site retention and an explicit “never save this field” control.
5. Optional encrypted export/import using a user-held passphrase (never automatic sync).
6. Integration tests in a real Chromium instance for restart, SPA, and duplicate-tab flows.

These are candidates, not commitments; each should receive a privacy and permission review before implementation.
