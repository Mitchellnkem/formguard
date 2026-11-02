# Testing checklist

Run automated checks first:

```sh
npm run typecheck
npm test
npm run build
```

## Core manual cases

- [ ] Standard text input saves after the debounce and restores after refresh.
- [ ] Textarea saves and restores.
- [ ] A basic plaintext contenteditable saves/restores without interpreting HTML.
- [ ] Multiple fields on one form keep distinct drafts.
- [ ] Multiple forms keep distinct drafts.
- [ ] A dynamically inserted eligible field is detected.
- [ ] Refresh, same-path navigation, and browser restart offer recovery.
- [ ] Duplicate tabs show the latest shared draft and never auto-restore it.
- [ ] SPA pathname navigation is detected within about two seconds where practical.
- [ ] Site disablement prevents new saves and removes visible recovery prompts.
- [ ] Re-enabling a site resumes protection.
- [ ] Individual deletion removes only that draft.
- [ ] Clear all requires confirmation and removes every draft.
- [ ] Expired drafts are removed on extension/page initialization.
- [ ] Clearing a field removes its saved draft.
- [ ] Ordinary form submission removes drafts for that form.
- [ ] Existing non-empty content is not overwritten on the first Restore click; a second explicit confirmation is required.

## Mandatory security cases

- [ ] Password input is never saved.
- [ ] Hidden input is never saved.
- [ ] `autocomplete="one-time-code"` is never saved.
- [ ] PIN, OTP, MFA, 2FA, and verification-code names/labels/placeholders are denied.
- [ ] `cc-*` autocomplete fields and credit/debit-card names/labels are denied.
- [ ] CVV, CVC, CID, and security-code fields are denied.
- [ ] Password, token, secret, API-key, private-key, seed-phrase, and recovery-code signals are denied.
- [ ] Disabled, read-only, hidden, and `aria-hidden` fields are denied.
- [ ] Malicious saved text such as `<img src=x onerror=alert(1)>` appears only as literal text.
- [ ] Page title, URL query, URL fragment, and full selectors are not stored.
- [ ] No draft contents appear in console warnings, popup preview, or options UI.

## Browser matrix

- [ ] Current stable Google Chrome on Windows/macOS/Linux as available.
- [ ] Current stable Microsoft Edge or another Chromium browser.
- [ ] Keyboard-only operation and visible focus behavior.
- [ ] 200% zoom and narrow popup/options viewport.
