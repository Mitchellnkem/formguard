# Release and packaging checklist

## Prepare

- [ ] Replace placeholders in `PRIVACY.md` and publish the policy at a stable URL if the store requires it.
- [ ] Update versions in `package.json` and `manifest.json` together.
- [ ] Review changes, threat model, permissions, and V0.2 exclusions.
- [ ] Run `npm install` to produce/review a lockfile and audit build dependencies.
- [ ] Run `npm run typecheck`, `npm test`, and `npm run build` from a clean checkout.
- [ ] Complete `TESTING.md` in target Chromium browsers.
- [ ] Load `dist/` unpacked and inspect popup, options, recovery, icons, and console errors.
- [ ] Confirm `dist/manifest.json` declares only the intended permissions and matches.

## Package

The ZIP root must contain `manifest.json`, not an outer `dist` folder.

PowerShell:

```powershell
Compress-Archive -Path .\dist\* -DestinationPath .\formguard-v0.1.0.zip
```

macOS/Linux:

```sh
cd dist && zip -r ../formguard-v0.1.0.zip .
```

- [ ] Unzip into a temporary directory and load it unpacked once more.
- [ ] Confirm the package contains no source maps if release policy excludes them (the MVP build currently includes them for debugging).
- [ ] Confirm no `.env`, credentials, tests, source attachments, or development dependencies are present.
- [ ] Archive the exact source commit, lockfile, test results, and uploaded ZIP checksum.

## Store submission

- [ ] Provide accurate single-purpose and permission justifications.
- [ ] Declare local form-content handling and absence of sale/transfer/telemetry accurately.
- [ ] Add screenshots that contain no real personal draft data.
- [ ] Link the reviewed privacy policy and support contact.
- [ ] After approval, install the store build and repeat a smoke test.

## Rollback

Keep the previous signed/store version and its source tag. If sensitive-field bypass, data exposure, destructive restore behavior, or widespread data corruption is discovered, pause distribution, document impact, issue a fixed version, and clearly advise affected users how to clear stored drafts.
