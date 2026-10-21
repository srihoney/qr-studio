# QR Studio — Phase 1 (Free Static QR Generator)

An entirely client-side, no-account QR generator for URLs, publicly hosted files, text, Wi-Fi networks, contacts, email, phone calls and SMS. Open source, no ads, no expiry or watermarks imposed by QR Studio.

**First-time deployer?** Follow [`docs/GITHUB_CLOUDFLARE_DEPLOYMENT.md`](docs/GITHUB_CLOUDFLARE_DEPLOYMENT.md), or see the quick settings below.

## What is included

- Non-expiring **static** QR encoding using bundled MIT-licensed QR core; no QR service dependency.
- Website and cloud file URLs with separate QR-expiration vs destination-availability explanations; known ephemeral URL-parameter warning is a heuristic, **not an actual expiry lookup**.
- Google Drive / Docs, Dropbox, OneDrive / SharePoint host recognition and Google Drive sharing guidance.
- Optional **local file picker that reads filename and size only**; tells users to host the file and paste its public share link. **The website does not upload, store, convert or host documents.**
- Wi-Fi, plain text, contact vCard, mailto, telephone, SMS QR modes.
- Custom QR foreground/background colors, contrast safety check, QR error correction level, optional centered raster logo (2 MB max), readable print title.
- PNG exports (about 1,024–3,072 pixels), SVG vector export, letter-size vector PDF export with optional embedded raster logo.
- Batch generation: 1–25 HTTP/HTTPS URLs per ZIP with per-code PNG, SVG and manifest. Limit applies per **batch only**, not per day.
- Optional user-triggered local history for URL/file/text codes only; Wi-Fi, contact, phone, email and SMS data **cannot** be saved to local history.
- Local scanner validation via BarcodeDetector in supported browsers; manual scan guidance otherwise.
- Browser-local offline regeneration after service worker has cached the site on HTTPS.
- Responsive design, keyboard-accessible form controls, and Cloudflare Pages security headers.

**No server, database, APIs, analytics, trackers, user login or payment integration.** QR data stays in the browser. External cloud links you scan will of course be requested by the scanner's device.

## Quick publish to Cloudflare Pages (connected to GitHub)

1. Unzip the package. Push the **contents** (not the ZIP file) into the root of a new GitHub repository named, for example, `qr-studio`.
2. In [Cloudflare Dashboard](https://dash.cloudflare.com/), choose **Workers & Pages → Create application → Pages → Connect to Git**. Approve GitHub access and select your repository.
3. Choose **Framework preset: None**, **Production branch: main**, **Build command: `exit 0`**, **Build output directory: `public`**, **Root directory: repository root**. No environment variables.
4. Deploy. Your public website should appear as `https://YOUR-PROJECT.pages.dev`.
5. Open the site, verify an HTTPS link QR with your phone and download all three file formats before sharing publicly.

See the [full illustrated-text deployment procedure](docs/GITHUB_CLOUDFLARE_DEPLOYMENT.md) for easy web-upload and Windows PowerShell instructions, updating the site, and troubleshooting.

## Run locally without installing Node.js

You can view the static HTML through any local web server. Python is one option:

```powershell
cd "C:\path\to\QR_Studio_Phase1\public"
py -m http.server 8000
```

Then open `http://localhost:8000` in your browser. Use Ctrl+C to stop. For security, avoid opening `index.html` with a `file://` URL because the site uses root-relative assets and a service worker.

Node.js is **not needed to deploy**, but optional Node 18+ can run code tests:

```powershell
cd "C:\path\to\QR_Studio_Phase1"
node --test tests/test-core.cjs
```

## Deployment layout

```text
QR_Studio_Phase1/
├── public/                  ← Cloudflare build output directory
│   ├── index.html
│   ├── favicon.svg
│   ├── _headers             ← HTTP security headers (Cloudflare Pages)
│   ├── sw.js               ← Optional cached offline use
│   └── assets/
│       ├── css/styles.css
│       └── js/
│           ├── qr-core.js  ← Bundled third-party QR encoding core
│           ├── utils.js
│           ├── exports.js
│           └── app.js
├── docs/
│   ├── GITHUB_CLOUDFLARE_DEPLOYMENT.md
│   ├── ACCEPTANCE_TESTS.md
│   └── PHASE1_SCOPE.md
├── tests/test-core.cjs
├── README.md
├── LICENSE
└── THIRD_PARTY_NOTICES.md
```

## Practical limitations

- **A static QR never expires on its own.** A website, document-sharing permission or online file might stop working. We cannot guarantee how long external destinations remain available.
- Even a small PDF or PowerPoint cannot realistically fit into a QR code. Host it on a cloud service and paste its link. Cloud storage is managed separately by the file owner and provider.
- We **do not** offer dynamic QR rerouting, click analytics, live link monitoring, guaranteed third-party retention, automatic public-permission verification or first-party file storage in Phase 1.
- Automated browser-level acceptance is still needed on your own real Chrome/Edge/Firefox devices before a public launch. See the test checklist.
- Certain browsers cannot decode QR previews automatically; the optional checker reports this accurately.

## Project licensing

Source created for this package is MIT-licensed. Vendor source is licensed separately under the MIT terms in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
