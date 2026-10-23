# Release notes — Studio Signature production integration

**Status:** source package ready for GitHub deployment; final real Cloudflare/mobile acceptance remains required.

- Replaces the Phase 3 homepage styling with the explicitly approved animated, multicolor Studio Signature brand and 3D QR hero graphic.
- Reuses production QR encoding, validation and vector export modules rather than the design-only demonstration scripts.
- Preserves the 8 QR modes, CSV batches, local QR inspector, no default QR at load, theme preference and no public counter or local QR history.
- Adds choosing View Online versus View & Download only within the hosted-file upload form. PDFs and image files are previewable; DOCX/PPTX/XLSX/TXT/MP4 use download mode. Cloud link users are governed by their own host, so no access-mode control is offered to them.
- Adds `/view/[id]` page for new uploads and retention-aware `/file/[id]` inline viewing, without breaking legacy file IDs.
- Adds private uploader deletion receipts and `/api/file/delete` backend; requires `migrations/0002_file_access.sql` to be run once before deployment.
- Leaves the already configured R2, D1, Resend, Turnstile, contact destination and scheduled cleanup Worker unchanged.
- Does not add malware scanning, an account system, paid plans, tracking pixels or public visitor counters. Cloudflare Web Analytics remains owner-controlled in the Cloudflare dashboard.

QA: 31 automated Node tests pass; desktop/mobile browser checks found no JavaScript exceptions or horizontal overflow, and QR generation and file-access selectors worked. Real Cloudflare storage, deletion, contact email delivery and PDF viewer behavior on each mobile scanning app must be accepted on the deployed site.
