# Free QR Studio — Phase 2 (Version 2.0)

Complete source-only, static website upgrade for the existing **freeqrstudio.pages.dev** Cloudflare Pages project. Built by modifying the real Phase 1 source package, not by starting from an unrelated mockup. No build system, API key, payment system, backend, analytics, ads, or hosted-file storage.

## What changed in Phase 2

- **Keeps the approved navy/teal layout** with professional cards, hero, editor, live preview, batch tool, history, validity report, and help sections. Replaces emoji-style mode icons with consistent SVG icons.
- **Removes numbered 01/02/03 section markers** everywhere in the interface.
- **One-click moon/sun theme switch** in the header; it remembers the preference in browser storage, with operating-system preference as the first-visit default. It changes only the website interface, **not exported QR colors**.
- **Sophisticated QR styling**, now supported across PNG, SVG and vector PDF:
  - Four module patterns: Classic, Rounded, Dots, Tiles.
  - Square and rounded finder/corner-eye styles (circular eyes deliberately excluded due to unreliable scanning).
  - Five coordinated color themes, independent QR/background/eye colors, optional two-color vertical gradient with safety contrast checks.
  - Local logo overlay (PNG, JPG, WebP ≤ 2 MB), with automatic High ECC when a logo is selected.
  - Optional “SCAN ME” caption below the QR in PNG/SVG; caption also appears on PDFs when selected. PDF print title remains separately configurable.
  - Four-module quiet zone preserved. Screenshot/export previews use the same renderers.
- **QR Inspector:** upload an existing PNG/JPG/WebP code image and decode it *locally* in browsers with `BarcodeDetector`. Unsupported browsers offer an honest manual-scan fallback. No webcam permission requested.
- Better desktop/mobile responsive layout, focus states, design reset, clearer expiration caveats.
- All Phase 1 modes preserved: Website, File link, Text, Wi-Fi, Contact, Email, Phone, SMS.
- Batch ZIP (up to 25 links per batch), optional limited browser-local history, cloud file link guidance, PNG/SVG/PDF exports, and QR readability checker preserved.

## Download, test, deploy

Read **[GITHUB_CLOUDFLARE_DEPLOYMENT.md](docs/GITHUB_CLOUDFLARE_DEPLOYMENT.md)** before replacing any production files. First push the package contents to a new `phase2-design` Git branch, review its Cloudflare **preview** URL, and merge only after acceptance.

Cloudflare Pages settings for the **existing** project:

| Setting | Value |
| --- | --- |
| Framework | None |
| Build command | `exit 0` |
| Build output directory | `public` |
| Root directory | Empty / repository root |
| Required environment variables | None |

**Existing production stays on the GitHub `main` branch until you merge Phase 2.** Cloudflare automatically deploys connected Git branches; see [Cloudflare Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/).

To test locally:

```powershell
cd "C:\path\to\QR_Studio_Phase2"
py -m http.server 8000 --directory public
```

Open `http://localhost:8000` and run [ACCEPTANCE_TESTS.md](docs/ACCEPTANCE_TESTS.md). For offline Node tests (Node 18+):

```powershell
node --test tests/test-core.cjs tests/test-phase2.cjs
```

Node is **only for developer tests**, not for Cloudflare deployment or QR generation.

## Security and limitations

- The QR code itself has **no expiration**; the website, file link, sharing permissions, account, network, or other destination may change or expire independently.
- Files are **not uploaded or hosted** by Free QR Studio. For a PDF, PowerPoint, ZIP, or video, use a publicly viewable Drive/OneDrive/Dropbox link. The file picker reads *name and size only*.
- Cloud link “expiration analysis” is a **local heuristic**, not a guaranteed expiry date, file-permission check, or external destination availability test.
- Wi-Fi credentials can be decoded by anyone holding the QR. Do not publish private or sensitive payloads; QR history intentionally excludes several personal-data modes.
- Rich QR styling can affect some scanners even when code contrast checks pass. **Always scan final exports on at least two phones before printing a large run**, especially if using dots, gradients, or logos.
- QR Inspector uses native `BarcodeDetector` support; it does **not** promise image reading or camera scanning on all browsers.
- The 25-item limit is **per batch**, not a daily, monthly or lifetime limit. QR generation itself remains unlimited.
- No permanent first-party file hosting, automatic permission auditing, dynamic editable redirects, camera scanner, multilingual translations, or click analytics in this release.

## Source layout

```text
public/index.html                  User interface
public/assets/css/styles.css      Light/dark UI and responsive layout
public/assets/js/app.js           Interactions, validation and themes
public/assets/js/exports.js       Canvas/SVG/PDF and ZIP local export
public/assets/js/utils.js         QR data builders and link metadata
public/assets/js/qr-core.js       Vendored MIT QR encoder
public/sw.js                       Offline static asset cache v2
public/_headers                    Cloudflare security policy
docs/                               Deployment, tests, release notes
tests/                              Node regression tests
LICENSE / THIRD_PARTY_NOTICES.md  Licensing
```

The project code is MIT licensed; the bundled QR encoder has its license in `THIRD_PARTY_NOTICES.md`.
