# QR Studio Phase 3 — GitHub + Cloudflare deployment

**This release needs more setup than Phase 2. Do not just push it to production.** The existing public website `https://freeqrstudio.pages.dev/` should stay on `main` while Phase 3 is reviewed on its own branch. The public QR editor continues to work if hosting/email configuration is missing; the server-dependent buttons deliberately remain disabled.

## 1 — Back up the live site and create a Phase 3 branch

1. Download/extract `QR_Studio_Phase3_Complete.zip`.
2. Go to the **existing** GitHub repository connected to your Cloudflare Pages project.
3. Download a GitHub ZIP of the current `main` branch as a backup.
4. Make a branch named `phase3-commercial-review` from `main`.
5. Replace the source files on that branch with the contents of the extracted Phase 3 folder, preserving the exact **root-level** folders `public/`, `functions/`, `migrations/`, `cleanup-worker/`, `tests/`, `docs/`. Do not upload the enclosing folder as another nesting level.
6. Commit all changes. Do not merge to `main` yet.
7. Cloudflare Pages will create a preview deployment. The initial preview may show upload/contact unavailable until you configure bindings and secrets.

Current Pages settings: Framework **None**, build command **`exit 0`**, build output **`public`**, root directory **empty (repository root)**. No `npm` build is required. **Pages Functions require Git integration or a supported Wrangler deployment; do not use dashboard drag-and-drop Direct Upload.**

## 2 — Create private storage (R2)

1. Cloudflare dashboard → **R2 Object Storage** → create bucket `qrstudio-temporary-files`. Select **Standard** storage.
2. Do not enable a public `r2.dev` endpoint or direct R2 custom-domain public access. Visitors must use `/file/<opaque-id>` so expiry is enforced.
3. Set a bucket **lifecycle rule to delete files after 30 days** (or `uploads/` prefix after 30 days). This is a secondary safety cleanup, not the only expiry control; deletion may occur after the nominal deadline.
4. Understand and monitor usage and any required billing setup. R2's free monthly allotment is limited.

## 3 — Create metadata database (D1)

From a normal Windows PowerShell with Node.js installed and authenticated Cloudflare Wrangler (`npx wrangler login`):

```powershell
npx wrangler d1 create qrstudio
```

Keep the returned **database ID** for the cleanup Worker configuration. Apply the schema remotely:

```powershell
npx wrangler d1 execute qrstudio --remote --file=migrations/0001_init.sql
```

The schema contains file IDs, randomized object locations, filenames, size, expiry, salted network-address hashes and minimal rate-control records. It does not store uploaded file bytes or contact message bodies.

## 4 — Bind R2 and D1 to the existing Pages project

Cloudflare → Workers & Pages → **your existing Pages project** → **Settings → Bindings**:

- Add **R2 bucket binding** named **`FILES`**, pointing to `qrstudio-temporary-files`.
- Add **D1 database binding** named **`DB`**, pointing to `qrstudio`.
- Bind resources separately for Preview and Production where the dashboard requires it. Prefer *separate test buckets/databases* in Preview so tests cannot contaminate live data.
- **Redeploy** the preview after changing bindings.

## 5 — Turnstile form protection

Cloudflare dashboard → **Turnstile** → Create widget for the website hostname. Configure relevant preview hostnames for testing; Cloudflare validation on the server checks the exact hostname. Keep separate test/production widgets if necessary.

In Pages → Settings → Variables and Secrets, configure:

| Name | Setting | Exposed to public? |
| --- | --- | --- |
| `TURNSTILE_SITE_KEY` | Turnstile public site key | Yes, in `/api/config` |
| `TURNSTILE_SECRET` | Turnstile private secret | **No** |
| `RATE_SALT` | Long, random string (e.g. password-manager generated) | **No** |
| `ADMIN_TOKEN` | Long, random unguessable token (for takedown tool) | **No** |

Private values must use **encrypted Secrets**, not public GitHub code. The site calls `/api/config` to decide whether to enable hosting/contact. Turnstile validates each submission server-side, and tokens can be used only once. A production Turnstile domain **must not be blocked by the site's CSP** (Phase 3 `_headers` already allows its scripts and frames).

## 6 — Contact emails privately via Resend

1. Create a free account at [Resend](https://resend.com/).
2. Verify a domain you own in Resend by adding their DNS records in your domain's DNS dashboard (Cloudflare DNS if available). A verified sender domain is normally needed for real third-party delivery; a `.pages.dev` project URL alone does **not** create a verified email sender domain.
3. Create a Resend API key with email-sending permission.
4. Add these additional **encrypted Secrets** to the Pages project:

| Name | Example/value |
| --- | --- |
| `RESEND_API_KEY` | Secret API key from Resend |
| `RESEND_FROM` | `QR Studio <feedback@YOUR_VERIFIED_DOMAIN>` |
| `CONTACT_TO` | **Your private recipient Gmail address** — set in dashboard only, never in code |

5. Test form sending from the preview and check **inbox and spam**. The recipient address is not returned to the visitor or embedded in public assets. Resend's free tier has an email limit. Contact form is disabled when required credentials are unavailable.

> IMPORTANT: If you do not own a verified sender domain, email delivery is **not ready**. Do not say the contact form works until a real message arrives.

## 7 — Deploy the deletion Worker

The Pages project cannot rely on its page load for deletion. Deploy the included separate cron Worker:

```powershell
cd cleanup-worker
Copy-Item wrangler.toml.example wrangler.toml
```

Open `wrangler.toml`; replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` with the ID from step 3, and adjust the bucket/database names if yours differ. Next:

```powershell
npx wrangler deploy --config wrangler.toml
```

This deploys a scheduled Worker running at **03:00 UTC every day**, deleting R2 objects whose timestamp is expired and then removing metadata rows; contact rate records older than 3 days are removed. If R2 deletion fails, the database row stays for retry. **A file is denied immediately at its recorded `expires_at` time even if cleanup executes hours later.** Enable log/error notifications for this Worker; check both R2 lifecycle rules and cron logs.

The cleanup Worker uses the same R2 bucket and D1 database as the live Pages project. For Preview, use test resources or a separate test cleanup Worker. The `cleanup-worker/wrangler.toml` file is ignored by Git as a precaution; only `.example` is shipped.

## 8 — Publish only after acceptance

1. Run tests: `node --test tests/test-core.cjs tests/test-phase2.cjs tests/test-phase3.cjs`.
2. Run `docs/PUBLIC_LAUNCH_ACCEPTANCE.md` including an actual 5 MB upload, 30-day expiry simulation on a **test** DB row, actual cleanup invocation, test email receipt, CSV import, light/dark and mobile tests.
3. Verify Cloudflare usage/billing alerts and abuse/takedown procedures.
4. Only after acceptance, merge `phase3-commercial-review` into `main`. Pages will update the **existing** `freeqrstudio.pages.dev` website. Do not create a second site.
5. Reconfirm Production R2/D1 bindings and encrypted secrets independently of Preview bindings, then verify live file access and contact delivery.

### Troubleshooting

| Problem | Check |
| --- | --- |
| QR editor works but file/contact disabled | `/api/config` and production/preview bindings/secrets, redeploy |
| HTTP 403 on upload/contact | Turnstile widget allowed hostname, expired/reused token, Origin header |
| HTTP 413 on file upload | Maximum 5 MiB incl. file; malformed or oversize multipart payload |
| HTTP 429 | Per-user daily quota, total daily/active storage cap, contact quota |
| Link returns HTTP 410 | File has passed exactly 30 days; working as intended |
| No email delivered | Sender-domain verification, Resend API key, CONTACT_TO, provider logs, spam |
| Files not physically deleting | Cron deployed, correct DB/R2 bindings, Worker logs and R2 lifecycle |
| Preview errors but main works | Configure Preview bindings/secrets separately |
| Pages deployment failed | Verify repo root, `public` directory and included sibling `functions/` |

References: [Pages bindings](https://developers.cloudflare.com/pages/functions/bindings/), [Pages functions](https://developers.cloudflare.com/pages/functions/get-started/), [Turnstile](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [R2 lifecycle](https://developers.cloudflare.com/r2/buckets/object-lifecycles/), [Cron triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/).
