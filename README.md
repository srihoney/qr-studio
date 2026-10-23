# QR Studio — Studio Signature production integration

This is the complete GitHub-repository replacement package for the **approved Studio Signature design**, based on the existing Phase 3 Cloudflare Pages application (not the standalone design prototype).

## Preserved live capabilities

- Approved animated navy/teal hero, original multicolor QR Studio wordmark and 3D floating QR graphic; mobile layout, sun/moon toggle, reduced-motion support.
- Eight QR types with blank initial state and browser-local generation.
- Four QR patterns, two eye styles, color themes, gradient, optional center logo, captions above/below, contrast checking, PNG/SVG/PDF exports.
- Cloud link workflow, private R2 upload with 5 MiB max, D1 expiry/quotas, Turnstile protection, 30-day access expiry, daily cleanup Worker and R2 lifecycle backup.
- CSV batch generation, QR image inspector, FAQ, private Resend contact form, privacy and terms pages.

## New in this release

- The file-upload form now offers **View Online** (PDF/JPG/PNG/WebP) or **View & Download** (all currently accepted file types).
- Shared QR links open a branded `/view/<id>` page. Supported PDF/image formats have a browser preview. Other formats present a download. The original `/file/<id>` endpoint still works for previously issued QR codes.
- Each new upload gets a separate **private early-deletion token**, returned only to the uploader. Save the offered deletion receipt. Token hashes are stored in D1 and used by `/api/file/delete`. No visitor accounts or saved-history screens.
- Existing admin endpoint, secrets, contact settings, cron and bindings are preserved. No malware scanner is installed and no malware-free claim is made.

**Important limitations:** View Online is not copy protection; users may still save content using browser features, capture screenshots, or extract files. PDF preview behavior depends on the browser and QR scanning app. Avoid uploading sensitive files. Cloudflare and Resend have free allowances, not unlimited free hosting.

## Required deployment sequence for your EXISTING Cloudflare setup

1. **Back up your GitHub repository**, Cloudflare R2/D1 metadata and current deployed state.
2. **Before pushing the new source**, run `migrations/0002_file_access.sql` **once** in the existing Cloudflare **D1 → qrstudio → Console**. The original tables already exist; **do not rerun** `0001_init.sql` or the new migration twice.
3. Replace the **contents of the existing GitHub repository root** with the contents of this ZIP and commit to `main` (or test in a branch first). Keep `public/`, `functions/`, `migrations/` etc. at root. Do not push an enclosing directory.
4. Cloudflare Pages should build automatically. Same settings: **Framework None; build command `exit 0`; output directory `public`; root blank**.
5. **No new Cloudflare secrets, R2 buckets, Turnstile widgets, Resend domain or cleanup Worker are required** if the existing Phase 3 production setup is still healthy. Preserve bindings `DB` → `qrstudio`, `FILES` → `qrstudio-temporary-files` and all seven existing variables.
6. Test both viewing modes, old QR links, deletion receipts, contact messages and expiry. See `docs/DEPLOY_CURRENT_SITE.md` and `docs/RELEASE_ACCEPTANCE.md`.

## Test command

```powershell
node --test tests/*.cjs
```

Unit/integration tests simulate the server-side Cloudflare services. Chromium visual QA verifies layout and QR generation, but **live R2/Turnstile/Resend and actual mobile PDF viewing are not independently confirmed until you perform acceptance on your deployment**.
