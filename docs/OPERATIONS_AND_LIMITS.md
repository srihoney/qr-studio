# Operations, retention, cost and abuse response

## What expires

- Static QR encoding: no built-in timer; the URL, password or underlying destination can stop working.
- Uploaded files via this site's R2: exactly 30 × 24 hours from upload according to server-recorded `expires_at`. The `/file/:id` handler returns HTTP 410 after the deadline.
- R2 object and D1 metadata: cleanup Worker removes expired material once daily; R2 lifecycle rule is a secondary guard. Deletion is not instantaneous at the exact deadline and can be delayed by errors or provider processing.
- External cloud links: expire or change at provider/owner discretion, not under QR Studio control.
- Contact messages: delivered by third-party email API to the operator's mailbox; operator/provider retention may extend beyond submission.

## Bounds (already implemented)

- File: max **5,242,880 bytes** (5 MiB) and selected safe document/image/video formats. HTML, SVG, ZIP archives and executables are rejected.
- Browser/local generation: no count limit. Batch: 25 codes per invocation, unlimited new batches.
- Network-address quota: 10 file uploads per day (the address is salted/hashed; shared networks may share a quota).
- Worldwide best-effort caps: 150 MiB new files/day and 3 GiB active storage.
- Contact: 3 submissions/day per hashed sender address, 60/day global. These limits conserve a free email-service allowance.
- Actual concurrency can cause small temporary overages of counters. These caps are operational safeguards, not a guaranteed financial hard stop.

## Content-risk policy

Treat **every uploaded URL as publicly accessible**. A scanner cannot assume the file is safe. Only selected file formats with signature checks are allowed and files are always served as downloads with `Content-Disposition: attachment`, no-sniff and CSP sandbox. There is no antivirus or human content moderation built in; therefore **owner-side monitoring and a takedown process are required before launch**. For early takedown:

```powershell
# Never put the admin token in GitHub or commit it to a script.
$token = Read-Host 'Paste secret ADMIN_TOKEN'
$headers = @{ Authorization = "Bearer $token" }
$body = @{ id = 'REPLACE-WITH-UUID-OF-FILE' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'https://freeqrstudio.pages.dev/api/admin/delete' -Headers $headers -ContentType 'application/json' -Body $body
```

Owners can extract the UUID from `/file/<id>`. This secret must remain private. Verify access control on a non-production file before using it for real removals. A request made with the wrong token intentionally returns 404.

## Monitoring

- Cloudflare Workers & Pages: execution volume/errors, D1 and R2 usage.
- R2 bucket storage / operations: monthly billing panel; set budget and alerts where available.
- Cleanup Worker: confirm daily scheduled executions and deletion logs. Alert on missing runs/failure.
- Resend: check delivery errors, domain verification, and free-tier quota.
- Turnstile: monitor verification failure rates and suspected automation.
- Keep a rollback plan: revert the GitHub branch; note this does *not* automatically remove already uploaded files from R2.

## Free does not mean cost-proof

At the time of package preparation, Cloudflare R2's Standard-storage free tier is **10 GB-month, 1 million Class A and 10 million Class B operations per month**, with other product limits separately applying. Resend's free plan advertises **3,000 emails/month and 100/day**. Public abuse or high traffic can exhaust these budgets. A custom verified email-sending domain may incur its own registration cost if you do not already own one. **Do not advertise zero operating cost forever or unbounded free uploads.**

Sources: https://developers.cloudflare.com/r2/pricing/ and https://resend.com/pricing and https://developers.cloudflare.com/r2/buckets/object-lifecycles/.
