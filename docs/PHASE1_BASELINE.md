# Phase 1 — Functional scope and design decisions

**Build type:** Source-only website, no desktop installer, no backend services, no vendor QR-redirect subscription.

**Operating model:** QR payloads encoded locally in browser using a bundled MIT-licensed algorithm. Static QR payload cannot be remotely changed. All UI files are static and deployable without package installation.

**Mode-specific behavior**

| Mode | Payload | Expiry communication |
|---|---|---|
| URL | HTTPS/HTTP URL | QR never; destination hosting/URL can expire, unknown exact date |
| File link | HTTPS/HTTP cloud URL | QR never; cloud file/permission must persist |
| Text | Text | QR never; data self-contained |
| Wi-Fi | WIFI: payload | QR never; passwords/SSID can change |
| Contact | vCard 3.0 | QR never; contact information can go stale |
| Email | mailto: | QR never; recipient address/app may become unusable |
| Phone | tel: | QR never; number must remain active |
| SMS | sms: | QR never; number and messaging app must remain available |

**File picker:** browser reads *name/size only*, not contents, does not upload. Size-based advice notes files above 10 MB as large but all files require hosting. No implicit cloud integration, no connected Google permissions.

**Privacy:** no login, tracking, file uploads, external QR API, or QR cloud database. Optional history is explicitly user-saved and excludes potentially sensitive Wi-Fi/contact/telephone/SMS/email codes.

**QR reliability:** enforces at least 4.5:1 color contrast and a four-module quiet zone. Optional center logo is limited in size and requires high ECC. Scans should be tested after printing; no software can guarantee all physical print/phone circumstances.

**Downloads:** PNG raster, SVG vector, PDF with vector QR modules. PNG size is rounded to a multiple of module count; 'about' size rather than exact requested pixels. Up to 25 URLs in a ZIP each time.

**Not included:** web-hosted file uploads, dynamic QR edits/redirects, QR analytics, guaranteed file or link permanence, third-party expiration-date APIs, automatic cloud access-permission checker, cross-user QR dashboard, user accounts or subscription billing.

**Release gate:** Code-level checks passed. Native browser acceptance required before declaring production acceptance. See `ACCEPTANCE_TESTS.md`.
