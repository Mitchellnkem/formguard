# FormGuard

**Never lose what you were typing again.**

FormGuard V0.1 is a small, privacy-focused Chrome/Chromium extension that saves eligible unfinished form text locally and offers an explicit restore prompt when the matching page and field return.

## Privacy and security at a glance

- Local-only `chrome.storage.local`; no server, account, sync, telemetry, or network request.
- Conservative sensitive-field rejection for passwords, OTPs, PINs, payment fields, authentication secrets, and suspicious metadata.
- Query strings and URL fragments are not stored.
- Existing meaningful field content is never silently overwritten.
- Drafts expire automatically (7 days by default) and storage is capped at 100 drafts.

See [the architecture and threat model](docs/ARCHITECTURE.md), [privacy policy](docs/PRIVACY.md), and [security checklist](docs/SECURITY_CHECKLIST.md).

## Project structure

```text
src/content/     Page field discovery, autosave, SPA handling, recovery UI
src/shared/      Field rules, sensitivity, matching, storage, utilities
src/popup/       Toolbar popup behavior
src/options/     Draft and settings management
static/          Extension HTML and CSS
tests/           Automated unit and security tests
docs/            Architecture, privacy, test, release, and backlog documents
scripts/         Build and packaging scripts
```

## Build

Requirements: Node.js 20+ and npm.

```sh
npm install
npm run check
npm test
npm run build
```

The unpacked extension is generated in `dist/`. Dependencies are development-only and are not shipped in the extension.

## Install for development

1. Build the project.
2. Open `chrome://extensions` in Chrome or Chromium.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select the generated `dist` directory.
5. Open `tests/manual-fixture.html` from a local web server (or use a normal test site). To test a `file://` fixture directly, enable **Allow access to file URLs** for FormGuard.
6. After rebuilding, click FormGuard's **Reload** button on `chrome://extensions` and refresh the test page.

## How recovery works

Typing two or more non-whitespace characters into an eligible field schedules a local save after 700 ms. On a later visit, a matching empty field displays Restore and Delete. Restore writes plain text, dispatches normal input/change events, and removes the recovered draft. New edits create a fresh draft.

The matching key combines origin, query-free path, a form fingerprint, and a field fingerprint. This reduces incorrect restores but means major markup changes may orphan an old draft, which can still be deleted in Manage Drafts.

## Package for distribution

```sh
npm run package
```

This rebuilds and creates `release/formguard-v0.1.0.zip`, with `manifest.json` at the ZIP root. Before upload, complete [the release checklist](docs/RELEASE_CHECKLIST.md), inspect the ZIP contents, test the exact package in a clean browser profile, and submit it through the Chrome Web Store developer dashboard with the privacy disclosure.

## Known limitations

- Chrome-protected pages, the Web Store, some PDF viewers, closed shadow roots, cross-origin frames, and canvas-based editors are unsupported.
- Rich-text editors are supported only when they behave like a standard contenteditable element.
- FormGuard does not encrypt browser-profile storage and cannot protect against someone with access to the unlocked profile.
- A site's structural changes can change matching keys.
- Concurrent edits to the same field in duplicate tabs use last-write-wins behavior.
- The extension cannot guarantee recovery from every crash or edits lost before the debounce completes.

See [the V0.2 backlog](docs/V0.2_BACKLOG.md) for deliberately deferred improvements.

## License

No license has been selected yet. Add one before public source distribution.
