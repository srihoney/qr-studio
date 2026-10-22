# Phase 2 acceptance checklist (before production merge)

Test on the **Cloudflare preview branch**, not the live website, first.

## Required

- [ ] Desktop: light theme closely matches the approved navy-header / white-editor layout; no numbered section markers or Pricing tab.
- [ ] Desktop: click the moon icon → full site becomes dark; click the sun icon → site becomes light. QR's **encoded data, foreground color and white background remain unchanged**. Reload the preview: choice persists.
- [ ] Mobile (390 px viewport): editor, preview, downloads, FAQ fit without horizontal scroll; theme switch remains visible.
- [ ] All 8 modes create a usable QR: Website, File link, Text, Wi-Fi, Contact, Email, Phone, SMS.
- [ ] Website/File link: scan with two phones and confirm the exact destination; for Google Drive, test link in private browsing.
- [ ] Change among Classic/Rounded/Dots/Tiles. Check both square/rounded finder eyes and 5 palettes; preview updates.
- [ ] Enable gradient; change second color and finder color. Low contrast must disable download and show a warning. Reset returns to safe defaults.
- [ ] Select optional caption; caption appears in PNG, SVG, PDF and preview. Test caption with `<` or `&` text for safe SVG output.
- [ ] Upload a raster logo; the app switches to High ECC. Clear logo; defaults restored. Test output with phone scanner.
- [ ] Export PNG, SVG, PDF for the same QR style. Confirm all three scan to the expected destination. Inspect PDF at high magnification.
- [ ] Download 2 valid URLs through Batch; ZIP includes 2 PNG files, 2 SVG files, and `links.csv`.
- [ ] Save URL QR to browser-local history; reload and load it; then clear history. Confirm Wi-Fi content cannot be stored in history.
- [ ] QR Inspector on a browser that supports BarcodeDetector: import a scannable image, confirm decoded content. On other browsers confirm honest unsupported message.
- [ ] Invalid URLs and low-contrast styling correctly disable exports. No external API calls or file uploads occur during QR creation.
- [ ] No errors in browser console; no missing local assets; cache updates to v2 after refresh.

## Extra cross-browser checks

- [ ] Chrome / Edge desktop
- [ ] Firefox desktop (automatic decode may be unavailable; manual scan remains supported)
- [ ] iPhone Safari, Android Chrome (physical QR scan verification)
- [ ] Keyboard navigation and focus indicators; reduced-motion OS setting
- [ ] Unusually long URLs and Unicode text; error handling for QR capacity

**Acceptance condition:** User approves the preview design and all required checks pass. Do not deploy `main` if scanner reliability or data accuracy is materially worse than Phase 1.
