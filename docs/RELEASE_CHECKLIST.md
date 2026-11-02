# V0.1 Release Checklist

- [ ] Confirm version in `package.json` and `manifest.json`.
- [ ] Complete automated checks from a clean dependency install.
- [ ] Complete the core, security, and browser test checklists.
- [ ] Review permissions and compare the built manifest with source.
- [ ] Search built files for remote URLs, source maps, secrets, debug logs, and unintended draft samples.
- [ ] Review the privacy policy and replace placeholder contact/legal language.
- [ ] Prepare store description, screenshots, icon set, support contact, and single-purpose justification.
- [ ] Run `npm run package` and inspect the ZIP; `manifest.json` must be at its root.
- [ ] Load and test the exact packaged build in a clean profile.
- [ ] Record the ZIP checksum and retain the source revision/build environment.
- [ ] Submit for store review without changing the tested package.
- [ ] After approval, install the store version and run a short smoke test.
