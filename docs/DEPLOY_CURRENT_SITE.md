# Upgrade your existing Free QR Studio site (no new Cloudflare project)

This package upgrades the site at `https://freeqrstudio.pages.dev/`. Your `main` GitHub branch already deploys Phase 3. **The only mandatory new Cloudflare configuration is one D1 schema migration**; all existing bindings and secrets should be retained.

## A. Before changing GitHub: D1 migration

1. In **Cloudflare → Storage & databases → D1 → qrstudio**, take a database backup / restore point using available D1 backup or Time Travel controls. Keep a copy of your existing GitHub `main` ZIP.
2. Open D1 **Studio / Console** and run this read-only check:

```sql
PRAGMA table_info(uploads);
```

3. If both `access_mode` and `delete_token_hash` already appear, **skip step 4** — the migration is already applied.
4. Otherwise, open `migrations/0002_file_access.sql`, copy each statement into the D1 Console, and execute **once**:

```sql
ALTER TABLE uploads ADD COLUMN access_mode TEXT NOT NULL DEFAULT 'download' CHECK(access_mode IN ('view','download'));
ALTER TABLE uploads ADD COLUMN delete_token_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_uploads_delete_token ON uploads(delete_token_hash);
```

5. Run `PRAGMA table_info(uploads);` again. Both new columns must exist. Your previous `uploads` rows and `contacts_rate` table remain in place. **Do not delete the D1 database or rerun the Phase 3 initial schema**.

If the console reports "duplicate column name", check `PRAGMA table_info(uploads)` and do not run the statement again. If another error occurs, stop and review before deployment.

## B. GitHub replacement

1. Open your existing GitHub `qr-studio` repository and download the existing `main` branch as a backup.
2. Recommended: create a test branch from `main`, upload the **contents** of this package (all folders at repository root), and review the diff. Never upload `.env` files, actual token strings or account credentials.
3. At the repository root ensure you have **both** `public/index.html` and `functions/view/[id].js`. The second file is needed for QR scan-to-view routes.
4. Once accepted, merge the test branch to `main`. If you prefer to update `main` directly, be aware Cloudflare will deploy it publicly immediately.
5. Do **not** rename `main` or change the GitHub repository name.

## C. Cloudflare Pages

Existing Pages project: `freeqrstudio`.

| Configuration | Keep |
| --- | --- |
| Framework | None |
| Build command | `exit 0` |
| Build output | `public` |
| Root | blank / repository root |
| R2 binding | `FILES` → `qrstudio-temporary-files` |
| D1 binding | `DB` → `qrstudio` |
| Contact secret | `CONTACT_TO` (recipient maintained privately in Cloudflare) |
| Email service | Existing `RESEND_API_KEY`, `RESEND_FROM` |
| Security | Existing `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET`, `RATE_SALT`, `ADMIN_TOKEN` |
| Cron | Existing `qrstudio-expiry-cleanup` Worker at `0 3 * * *` |

Your `CONTACT_TO` email **does not need to appear in GitHub**, and it should never be copied into client-side JavaScript.

After GitHub commit, Cloudflare → Workers & Pages → `freeqrstudio` → **Deployments** should show a successful build from `main`. Refresh the site with Ctrl+Shift+R if a cached version is displayed.

No separate R2 bucket, D1 database, email sending domain, or cleanup Worker needs to be created. Your existing R2 `uploads/` 30-day lifecycle rule stays unchanged. Note that any new Cloudflare feature flags or secret changes require redeployment.

## D. Verify on the published site

Follow `docs/RELEASE_ACCEPTANCE.md` completely. In particular: after upload, a QR code should now encode `/view/<file-id>`; the viewer must open for PDF/images, while legacy `/file/<id>` links remain accessible until expiry. Test private deletion tokens and ensure no sensitive token appears in your QR code or public file URL.

## Rollback

If the site behaves incorrectly, use **Cloudflare Deployments → Roll back to previous successful deployment** or revert the GitHub changes to the earlier commit. The new D1 columns can remain in place; prior Phase 3 code ignores them. Do not delete the D1 database or bucket to roll back.
