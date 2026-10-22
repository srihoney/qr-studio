# Phase 3 release notes

**Approved visual direction**: retain Phase 2 navy/teal polished commercial UI. This release is an implementation candidate, not proof of production acceptance.

Implemented: animated multi-tone QR Studio logo, four aligned navigation links, smaller moon/sun button, removed version badge, removed QR default example/selection, removed browser QR history, compact customization, top/bottom captions across three output formats, CSV batch support, redesigned footer, privacy/terms pages, private contact form, optional Cloudflare-backed 30-day file sharing (5 MiB), D1 metadata, Turnstile validation, server-side expiry, R2 scheduled/lifecycle deletion, quotas and admin takedown.

Preserved: website/cloud link/text/Wi-Fi/contact/email/phone/SMS QR modes, all approved QR rendering styles, logo overlays, gradients, readable contrast guards, QR Inspector, PNG/SVG/PDF export, 25-code manual batch ZIP, light and dark modes, local QR generation.

Architecture decisions: **No GitHub-as-file-storage**, no anonymous Google Drive service-account storage; Cloudflare R2 gives a controlled first-party URL and server-enforced expiry. Email owner address only a Cloudflare secret. No pricing tab, signup, credit system, ads or artificial QR generation count limit. Hosted uploads have usage limits to protect the owner.

Validation: 24 Node regression tests passed (Phase 1+2 core plus Phase 3). Interactive headless browser checks with injected local assets passed for desktop and mobile, including empty start, mode changes, code rendering, captions and dark mode. **Not tested**: full Pages/Workers real-runtime integration, successful R2 writes on Cloudflare, live contact email delivery, actual scheduled cleanup, full cross-device acceptance. Those remain release gates.
