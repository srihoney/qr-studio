# Phase 1 acceptance checklist

## Code-level verification performed during packaging (2026-10-21)

- [x] 9 Node unit tests passed (URL validation, host recognition, UTF-8 payloads, error correction, Wi-Fi/SMS/contact, SVG, PDF, ZIP).
- [x] Python `zipfile` opened generated ZIP and read its contents.
- [x] PyMuPDF opened PDF, extracted text and rendered vector QR.
- [x] OpenCV QRCodeDetector successfully decoded PNG, SVG-rendered and PDF-rendered QR carrying a real Google Slides sharing-link-shaped test URL, matching 135 encoded bytes.
- [x] OpenCV decoded three Unicode QR payloads accurately (Telugu, Chinese/Russian, Hindi).
- [ ] Full interactive browser acceptance: **NOT EXECUTED**. The verification container's managed Chromium policy blocked navigation even to local pages and `file:` URLs (`ERR_BLOCKED_BY_ADMINISTRATOR`). This does **not** establish a product defect, but prevents claiming browser acceptance.
- [ ] Windows Chrome and Edge desktop, iOS/Android scanning, keyboard, assistive technology, Cloudflare live deployment not yet verified.

## Manual browser acceptance — run after GitHub/Cloudflare deploy

1. [ ] Website URL mode: test normal HTTPS, http, invalid URL, and unsafe `javascript:` URL (must reject unsafe URL).
2. [ ] File link mode: test Google Drive and OneDrive links with public permissions; link should open to logged-out viewers, without time-based subscription restriction.
3. [ ] File selector: show name, size and external cloud upload instructions; no file leaves the browser.
4. [ ] All 8 QR modes produce a printable code.
5. [ ] Encode and scan a non-English text QR (Unicode).
6. [ ] Low-contrast colors disable generation and downloads; restore readable colors and recheck.
7. [ ] Optional logo with high ECC can scan successfully on a phone; avoid tiny printed codes.
8. [ ] Download PNG, SVG and PDF; check file signatures, scan each output.
9. [ ] Export batch of 2 links; ZIP contains 2 PNG, 2 SVG and CSV, all valid.
10. [ ] Invalid links in batch show line-specific error; 26 links show per-batch limit.
11. [ ] Local history save/load/clear works for URL/file/text and blocks sensitive modes.
12. [ ] Check date fields: plain Google link -> `Not verified`; URL with `expires=...` -> `Possibly expiring`, without inventing a date.
13. [ ] Refresh on desktop and on mobile at 375 px; no horizontal scrolling, all controls reachable.
14. [ ] Keyboard-only use: tab through inputs, modes and export buttons.
15. [ ] In Chrome/Edge, QR read-check works if BarcodeDetector supported; otherwise correct manual fallback.
16. [ ] After fully loaded, disconnect network, refresh site and test QR export (HTTPS cached site).
17. [ ] Inspect DevTools Network: no third-party requests while generating codes; no file upload or analytics.
18. [ ] Check Cloudflare build `exit 0`, output `public` and successful `*.pages.dev` deployment.

**Release criteria:** All applicable manual cases pass, or any browser-specific unsupported feature is transparently disclosed. Do not declare final production acceptance on code tests alone.
