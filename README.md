# QR Studio — Phase 3 source package

**Release status:** Complete Phase 3 implementation package; *production acceptance pending real Cloudflare/Turnstile/Resend integration tests*. Preserves the Phase 2 QR encoding and export engines. No EXE, installers, paid QR plans or artificial QR-generation limit.

## Included features

- Approved navy/teal QR Studio design with a multi-tone animated 3D-effect logo, four aligned header links, a small sun/moon toggle, accessibility and reduced-motion support.
- No version badge, step numbers, default-selected QR, sample QR at load, or saved history panel.
- QR generation for URL, file, text, Wi-Fi, contact, email, phone, SMS; all generated locally in the browser.
- File section with both **cloud links** and **first-party uploads**. Files up to 5 MiB (5,242,880 bytes) are stored in Cloudflare R2; their links stop serving content after **30 × 24 hours**. Daily cron and R2 bucket lifecycle policy provide cleanup. Cloud-file links are controlled by the external provider.
- Compact QR styling with the existing pattern, finder/corner, palette, gradient, logo and contrast controls; top/bottom/none captions across PNG/SVG/vector PDF.
- Batch QR from pasted URLs or local CSV with `name,url` columns (up to 25 items per batch, unlimited batches); exports named PNG/SVG plus CSV in ZIP.
- Contact form (name/email/message) with server-side Turnstile protection, Resend delivery, and receiver configured ONLY by Cloudflare secret `CONTACT_TO`. The owner's address is absent from all website assets, public JSON responses, and repository files.
- Publication-facing privacy and terms pages; no public Pricing or subscription pages.
- Opt-in QR image decoding where the browser offers BarcodeDetector; no webcam permission.

## Architecture

| Path | Purpose |
| --- | --- |
| `public/` | Cloudflare Pages front-end; `public/` remains build output |
| `functions/api/config.js` | Public feature flags (never returns secrets) |
| `functions/api/upload.js` | MIME/signature check, 5 MiB cap, Turnstile, D1 quotas, R2 storage |
| `functions/file/[id].js` | Opaque download URL, expiry check (HTTP 410), no-store attachment delivery |
| `functions/api/contact.js` | Contact validation, D1 anti-abuse, email-provider API |
| `functions/api/admin/delete.js` | Secret-protected early removal/moderation |
| `functions/_lib/common.js` | Shared security/retention helpers |
| `migrations/0001_init.sql` | D1 tables/indexes |
| `cleanup-worker/` | Separate Cloudflare Worker cron for deletion |
| `docs/` | Detailed deployment, QA, incident/cost and release guidance |

## How to use

**Always start with `docs/GITHUB_CLOUDFLARE_DEPLOYMENT.md`**. This is a backend release, not simply a replace-the-public-folder update. You must create and connect R2/D1, provision Cloudflare Turnstile, set mail credentials, and deploy the scheduled cleanup Worker before enabling public file uploads.

Current build output stays `public`, root directory stays empty, build command stays `exit 0`. The `functions/` directory is a sibling of `public/` at repository root and is deployed by Cloudflare Pages Git integration.

To run static UI locally (the upload/contact buttons stay disabled without configured backend):

```powershell
py -m http.server 8000 --directory public
```

To run automated tests with Node.js 22+:

```powershell
node --test tests/test-core.cjs tests/test-phase2.cjs tests/test-phase3.cjs
```

## Security and realistic cost boundaries

- **No free-hosting guarantee**: Cloudflare R2 has a free allowance, not unlimited free storage or requests. This project caps individual uploads at 5 MiB, 10 uploads per network address per day, about 150 MiB worldwide per day, and about 3 GiB active data. These are best-effort usage guards; monitor all platform and email-service quotas and shut off uploads if abused. R2 enablement may require billing setup.
- **Expiry**: Requested one month is defined here as an exact 30-day period. File-serving checks are authoritative immediately at expiry; actual deletion can happen later (daily cron + R2 lifecycle failsafe).
- **Privacy**: Static QR payloads are generated locally. Hosted files are public to anyone with the URL and are transmitted to Cloudflare. Contact messages are sent through Resend and the receiving inbox. No files are stored in Google Drive or GitHub by this app.
- **Security controls**: secure random opaque file IDs, server-side validation, file signatures/extensions, attachment-only downloads, strict upload sizes, Turnstile, same-origin checks, rate/volume limits, headers, early moderation removal and documented abuse-handling process. These do not replace antivirus scanning, abuse monitoring, legal review or real-user testing.
- **Do not release publicly before completing all items in `docs/PUBLIC_LAUNCH_ACCEPTANCE.md`.** Deployment/secret configuration, real mail deliverability and live expiration cleanup are NOT tested by the offline unit tests.

## References

- [Cloudflare Pages Functions bindings](https://developers.cloudflare.com/pages/functions/bindings/)
- [Cloudflare Pages Functions routing](https://developers.cloudflare.com/pages/functions/routing/)
- [Cloudflare Workers cron](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [R2 object lifecycles](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)
- [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Resend API](https://resend.com/docs/api-reference/emails/send-email)
