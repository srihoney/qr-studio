# QR Studio — real public acceptance checklist

Automated unit tests do not establish that the live site, R2 storage or mobile PDF preview is ready. Test with disposable, non-sensitive content.

- [ ] Existing website loads; brand/animated hero matches approval; keyboard and narrow mobile navigation are usable; motion reduction works.
- [ ] No QR is pre-generated until a QR type and valid payload are selected.
- [ ] Generate and scan URL, text, Wi-Fi, contact, email, phone and SMS codes; compare contents to the entered data.
- [ ] Check solid/gradient, Classic/Rounded/Dots/Tiles, corner styles, contrast warnings, logo, top/bottom caption, PNG/SVG/PDF downloads and QR readability.
- [ ] Generate named QR files in a CSV-imported batch; confirm the ZIP contains the expected individual files.
- [ ] Upload a disposable PDF under 5 MiB in **View Online** mode. Confirm QR opens `/view/<id>` and PDFs display in Chrome/Edge and Safari where supported; check no explicit Download action is offered by our viewer.
- [ ] Upload a disposable image in **View & Download** mode. Confirm both viewing and the download link; download must return original bytes and filename.
- [ ] Upload a DOCX/PPTX using View & Download; confirm no untrusted Office HTML is rendered inline.
- [ ] Try >5 MiB file, invalid extensions, invalid Turnstile, unsupported preview choice, and cross-origin POST. Ensure failures do not store a file.
- [ ] Save the deletion receipt. Confirm its token is NOT in the QR's URL and NOT stored in front-end history. Use Delete my file now; confirm `/view/<id>` and `/file/<id>` become inaccessible.
- [ ] Use a saved deletion receipt to remove a different disposable test file. Confirm incorrect deletion token is rejected.
- [ ] Confirm an older Phase 3 QR still opens the same `/file/<id>` URL (no broken old links).
- [ ] Verify older file expiry and a controlled expiry simulation produce HTTP 410. Confirm cleanup Cron physically deletes expired test R2 object and D1 record; never modify real users' expiration timestamps for this test.
- [ ] Submit a test contact message; confirm delivery to owner-controlled `CONTACT_TO` address privately and Turnstile verification.
- [ ] Confirm Cloudflare Web Analytics is owner-only, with no public visitor counts or tracking scripts added by this release.
- [ ] Review R2 and D1 storage/operation utilization and current Cloudflare billing alerts. Existing best-effort 3 GiB active-file and per-day limits are not hard billing caps.
- [ ] Do a privacy/abuse review before public marketing: no malware scanning, anyone with link can access files, "View Online" cannot prevent saving.

For public use, exercise the workflow from desktop, Android and iPhone where available. Confirm the PDF behavior in actual QR scanner apps; embedded browser viewers differ.
