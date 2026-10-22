# Phase 2 release notes

**Version:** 2.0.0 (source package for review)  
**Baseline:** Phase 1 source ZIP supplied in the prior conversation.  
**Scope:** UI redesign matching approved screenshot, additional QR styling, light/dark toggle, local image QR Inspector. Preserves Phase 1 functionality and static deployment.

Changes: see README. No backend, dynamic QR redirect service, accounts, file hosting, telemetry, third-party QR-generation API or pricing page.

**Testing performed while packaging:**
- Existing 9 Node core tests passed.
- Browser rendering and interaction through headless Chromium DOM injection: light and dark themes; pattern/finder/gradient/caption changes; PNG/SVG/PDF exports; reset; Wi-Fi/File link; batch ZIP; mobile layout (no horizontal overflow); zero JavaScript page errors.
- A styled PNG decoded to its original URL using OpenCV.
- Pattern/finder QR sweep at 1024 px: 8 of 8 supported combinations decoded by OpenCV. Circular finder was tested but removed due to scan reliability issues.
- SVG and PDF render cleanly, and their QR content decoded after appropriate image scaling/cropping in OpenCV. Automated decoding depends on scanner/resolution; final physical-device acceptance remains pending.
- Cloudflare deployment, direct camera/physical printer checks, and real hosted preview acceptance **not performed** in the package environment.

Known limits: See README; unsupported QR-reader API displays fallback. CSS theme changes apply to the interface, not QR payload or output styling.
