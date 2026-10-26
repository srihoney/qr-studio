# QR Studio search visibility package — 25 October 2026

## What this update does
- Homepage: descriptive title/meta description, canonical URL, Open Graph and social-preview metadata, guides footer link.
- Crawl discovery: public/robots.txt and public/sitemap.xml for seven public static URLs.
- Six human-readable pages: /guides/ index plus five helpful tutorials (PDF, Wi-Fi, logo, research posters, WhatsApp).
- CTAs select the corresponding existing QR editor mode through a whitelisted `?type=` parameter. The generator never creates a code or uploads user data merely because a link was opened.
- New isolated guide stylesheet and 1200x630 social preview generated from the existing QR Studio artwork.
- Cache name version updated in public/sw.js.

## Important domain note
The verified accessible homepage is currently https://freeqrstudio.pages.dev/. This update intentionally uses that as canonical and sitemap host. **Do not change canonicals to qrstudio.win until you actually own it, add it to Cloudflare Pages and verify HTTPS deployment.**
After connecting the custom domain, replace EVERY occurrence of `https://freeqrstudio.pages.dev` in public/index.html, public/guides/*/index.html, public/sitemap.xml and public/robots.txt with the actual primary URL (e.g. https://qrstudio.win). Also update social image URLs and Google Search Console. Keep old QR file-sharing URLs functional; do not broadly redirect temporary /file/ or /view/ paths without verifying them.

## Manual setup: cannot be done in a ZIP
1. Deploy to Cloudflare Pages and check `/robots.txt`, `/sitemap.xml`, `/guides/`, every guide URL, and share image returns HTTP 200.
2. Add property `https://freeqrstudio.pages.dev` to Google Search Console. Verify site ownership using the method Google offers (DNS, HTML tag or HTML file). This requires account access.
3. Submit `https://freeqrstudio.pages.dev/sitemap.xml` in Search Console and use URL Inspection on the homepage and guides.
4. Use Cloudflare Web Analytics (already available from your site dashboard) and Search Console Performance to measure search impressions, visits and useful pages. Do not assume Google has indexed a page until Search Console confirms.
5. Verify mobile and desktop guides, each guide CTA's selected QR mode, PNG/SVG/PDF export, file uploads, reader/inspector, and browser history. Test on the live domain.
6. In a social link debugger (e.g. Facebook Sharing Debugger), check actual preview image and title after deploying.

## Future growth, no extra spending required
Share real tutorials with researchers, teachers and small-business owners; show before/after examples and a working mobile scan. Avoid mass-spamming communities. Analytics tell us what to improve next. SEO does not guarantee ranking or traffic.

## Limits
- The update does not install/verify Search Console, social platform indexing or custom domain registration.
- The 30-day, 5 MiB restrictions for QR Studio-hosted files remain unchanged.
- Do not publish private QR content in the sitemap, analytics or structured data.
