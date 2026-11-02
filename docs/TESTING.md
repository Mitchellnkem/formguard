# Testing Checklist

Run automated checks first:

```sh
npm run check
npm test
npm run build
```

Use `tests/manual-fixture.html` through a local server and inspect `chrome.storage.local` from the extension service worker/devtools where useful.

## Core behavior

- [ ] Standard text input saves after the debounce and restores after refresh.
- [ ] Textarea saves and restores plain text including line breaks.
- [ ] Standard contenteditable saves and restores without interpreting HTML.
- [ ] Multiple eligible fields create independent drafts.
- [ ] Multiple forms distinguish fields with similar names.
- [ ] Dynamically inserted fields are detected once.
- [ ] Refresh, navigation away/back, browser restart, and normal tab close preserve drafts.
- [ ] Duplicate tabs use last-write-wins for the same field and do not duplicate stored records.
- [ ] `pushState`/`replaceState` SPA path changes rescan and use the new pathname.
- [ ] Disabled websites stop tracking immediately and can be re-enabled.
- [ ] Individual deletion and Clear All remove the intended records.
- [ ] Old drafts expire when storage is next accessed.
- [ ] Restore/Delete controls are keyboard accessible.

## Mandatory security cases

- [ ] `type=password` and `type=hidden` never save.
- [ ] `autocomplete=one-time-code` never saves.
- [ ] Labels/names/IDs/placeholders for OTP, PIN, CVV, CVC, card number, security code, token, API key, recovery seed, SSN, and routing/account number never save.
- [ ] Existing different meaningful content is not overwritten and receives no recovery prompt.
- [ ] Query parameters and fragments never appear in storage.
- [ ] A value such as `<img src=x onerror=alert(1)>` stays inert plain text.
- [ ] Clearing a field removes its saved draft.
- [ ] A field changed to sensitive before the debounced save is rejected.

## Browser matrix

- [ ] Latest stable Chrome on Windows/macOS/Linux as available.
- [ ] Latest stable Chromium-based Edge.
- [ ] At least one clean browser profile with no developer tools open.
