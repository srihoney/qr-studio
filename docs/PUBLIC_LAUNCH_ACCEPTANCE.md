# Phase 3 — Public launch acceptance (all checks required)

**Status at package creation:** Source implementation complete; offline 24 regression tests and browser-injected UI interaction checks passed. **NOT YET APPROVED FOR PUBLIC LAUNCH.** Live Cloudflare integration, deletion cron and third-party email delivery could not be verified from this environment. The exact site configuration will determine final functionality.

## A. Interface and design

- [ ] Desktop at 1440 and 1024 px: all four header links stay on one line; logo is colorful/animated, version badge absent; small sun/moon toggle works.
- [ ] Phone at 390 and 320 px: navigation remains usable, workspace scrolls naturally, no horizontal overflow, logo does not obscure links.
- [ ] Light and dark mode are legible across workspace, contact and upload; theme persists on reload.
- [ ] Reduced-motion preference disables nonessential visual animations.
- [ ] On a fresh page load **no mode is selected and no QR is visible**.
- [ ] Selecting each of 8 QR types and entering valid content produces a matching scannable code; 8 modes from Phase 2 are preserved.
- [ ] Section numbering, Pricing, old history, and “free and open source” marketing are absent.

## B. QR quality/export

- [ ] Classic, Rounded, Dots, Tiles and both eye styles scan on at least two real phones.
- [ ] Gradient, five quick palettes, valid logo, high ECC, contrast rejection work.
- [ ] Caption **above** and **below** appears consistently in preview, PNG, SVG, PDF.
- [ ] PNG/SVG/PDF all decode as identical expected payloads for the same code.
- [ ] Inspector decodes supported uploads, and handles unsupported browsers honestly.

## C. Files — real backend (not mocked)

- [ ] R2 Standard bucket bound as `FILES`; D1 schema installed and bound as `DB`.
- [ ] Turnstile real hostname and secret configured; blank, fake, expired and reused tokens rejected.
- [ ] Valid PDF, PNG and PPTX uploads under 5 MiB succeed and yield unique opaque `/file/<id>` links.
- [ ] Disguised HTML/executable, invalid PDF, empty file, >5 MiB file, invalid multipart rejected safely.
- [ ] Public URL works on another device; downloaded bytes equal uploaded bytes; no executable inline rendering.
- [ ] Manually age a **test** database record beyond 30 days: accessing it responds HTTP **410 Gone** immediately; exact 30 days displayed.
- [ ] Invoke cron in test environment: corresponding R2 object and D1 metadata are deleted; cron failures leave rows to retry.
- [ ] Bucket lifecycle deletion rule set for 30 days (fallback); R2 direct public domain disabled.
- [ ] Anti-abuse quotas and 429 error messages work; storage/usage monitored and automatic costs reviewed.
- [ ] Early abuse deletion endpoint protected by ADMIN_TOKEN; valid request deletes test content.

## D. Batch CSV

- [ ] Paste 1–25 links, ZIP download with individual PNG/SVG and manifest.
- [ ] Upload CSV with `name,url` header and quoted values, produce correctly named exports.
- [ ] Empty CSV, malformed quoted cells, non-HTTP links, duplicated filenames, >25 entries all produce actionable errors.

## E. Private contact form

- [ ] Form validates name, email and message, requires Turnstile and sends a **real** email to the private inbox.
- [ ] Check spam, provider logs, verified sender domain, and Reply-To behavior.
- [ ] No private inbox address in HTML, JS, CSS, public API response, web console, GitHub or customer-facing messages.
- [ ] Email failure produces honest error; no false success when provider returns error.
- [ ] Rate limits protect the free email allowance; abuse-report/takedown process is staffed.

## F. Policy/operations

- [ ] Privacy and Terms pages reviewed for actual provider usage, retention, local law and desired business details.
- [ ] Account owner verifies Cloudflare billing visibility, R2 free tier and Resend limits before public launch.
- [ ] Main branch held stable until preview QA accepted; verify rollback by redeploying previous commit.
- [ ] Real Cloudflare preview and then Production smoke tests complete, including R2/D1/cron/email.

All boxes must be verified before calling the public system **commercial-release accepted**.
