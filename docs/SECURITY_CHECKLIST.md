# Security Checklist

## Before every release

- [ ] Password and hidden inputs create no draft.
- [ ] OTP, one-time-code, PIN, CVV/CVC, card-number, payment, secret, token, recovery, and suspicious-name cases create no draft.
- [ ] Supported ordinary text, textarea, and contenteditable cases still work.
- [ ] Sensitivity is checked again at save time after page mutation.
- [ ] Stored URLs contain origin and pathname only—no query, fragment, username, or password.
- [ ] Restore is explicit and refuses to replace different meaningful content.
- [ ] Page and stored strings reach the DOM only through `textContent`, `value`, or safe attribute APIs.
- [ ] Manifest CSP disallows remote/inline executable code; no `eval`, `new Function`, or remote script exists.
- [ ] No network API, telemetry, analytics, or external endpoint exists in source or build.
- [ ] Only `storage` and necessary host access are requested.
- [ ] Expired drafts are removed and the 100-draft/100,000-character limits work.
- [ ] Options and popup tolerate malformed storage and unavailable/restricted tabs.
- [ ] Production ZIP contains only expected static assets, bundles, and manifest.
- [ ] `npm run check`, `npm test`, and `npm run build` pass from a clean install.

## Manual adversarial review

- [ ] Labels and ARIA references with sensitive terms are rejected.
- [ ] A page changing an ordinary field into a sensitive field before debounce cannot save it.
- [ ] HTML-looking draft text is restored literally and never rendered.
- [ ] A page cannot access recovery shadow-root controls or extension storage.
- [ ] A hostile page removing/re-adding fields does not create duplicate handlers.
- [ ] A stored malformed object does not crash popup/options/content behavior.
