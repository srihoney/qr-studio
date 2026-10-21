# Beginner deployment: GitHub + Cloudflare Pages

**Goal:** A free public QR generator at a `*.pages.dev` address that redeploys automatically when you update GitHub.

**Requirements:** Free GitHub account, free Cloudflare account, Windows computer or other desktop. No credit card for our app features, no paid QR provider, and no Node/npm installation to publish a static site. Hosting and Git provider policies can change; review their plan terms.

## Part A — Unzip the package

1. Download `QR_Studio_Phase1.zip` and open its location in Windows Explorer.
2. Right-click → **Extract All…**.
3. Open the extracted `QR_Studio_Phase1` folder. Confirm you can see `public`, `docs`, `tests`, `README.md`, and `LICENSE`.
4. Do not upload the compressed ZIP file as your source repository. Upload the files and directories **inside** the extracted folder.

## Part B — Create the GitHub repository

1. Visit **https://github.com/new** and sign in.
2. Repository name: **qr-studio** (or another name you like).
3. Description: `Free browser-based permanent static QR code generator`.
4. Visibility: **Public**, if you want to publish the open-source project. Private also works with Pages if permitted by your plan.
5. **Do not add a README, license or .gitignore** at creation: the ZIP already has them.
6. Click **Create repository**.

### Easiest browser upload

1. On the empty repository's setup page, look for **uploading an existing file**. Alternatively choose **Add file → Upload files**.
2. In Windows Explorer open the extracted `QR_Studio_Phase1` folder.
3. Drag the items **inside the folder**, including its `public` folder, into GitHub's uploader. Confirm the file list retains paths such as `public/index.html` and `public/assets/js/app.js`; do not flatten the directory structure.
4. Enter a commit message like `Add QR Studio Phase 1` and click **Commit changes**.
5. Verify the repository root contains `public`, `docs`, `tests`, `README.md` etc. **If folder dragging does not preserve the directory layout**, use GitHub Desktop or PowerShell below instead.

### Alternative: Windows PowerShell with Git

If you have [Git for Windows](https://git-scm.com/downloads/win) installed, open PowerShell in the extracted `QR_Studio_Phase1` directory and run:

```powershell
git init
git add .
git commit -m "Add QR Studio Phase 1"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/qr-studio.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username, and replace `qr-studio` if your repository has a different name. Git may ask you to authenticate in the browser. If Git requests your name/email for the first commit, follow its displayed `git config` instructions. **Do not paste passwords or tokens into this website.**

## Part C — Connect Cloudflare Pages

1. Open **https://dash.cloudflare.com/** and sign in.
2. Navigate to **Workers & Pages**.
3. Choose **Create application → Pages → Connect to Git** (in some dashboard layouts this is **Import an existing Git repository**).
4. Select **GitHub**, authorize Cloudflare for the `qr-studio` repository, then select that repository.
5. Under **Set up builds and deployments**, use the **exact settings**:

| Setting | Value |
|---|---|
| Project name | `qr-studio` (if free; choose another if taken) |
| Production branch | `main` |
| Framework preset | **None** |
| Build command | `exit 0` |
| Build output directory | `public` |
| Root directory | Keep default / repository root |
| Environment variables | **None** |

6. Click **Save and Deploy** (wording might differ).
7. Wait for a successful deployment status. Cloudflare provides a link similar to `https://qr-studio.pages.dev`; use the actual URL Cloudflare shows.
8. Open the URL and test it with a phone.

**Do not select the GitHub Pages product by mistake.** GitHub stores code; **Cloudflare Pages** serves the website.

## Part D — First public checks

1. Website mode: encode `https://example.com`, download PNG and scan it.
2. File link mode: paste a Google Drive public file link. Open that link in a **private/incognito browser window** where you are not logged into Google, and verify anyone can view it.
3. Download SVG and PDF. The PDF should show sharp QR modules when enlarged.
4. Select a local file. Confirm the website does **not** upload it, but tells you to paste an externally hosted link.
5. Confirm mobile layout and one batch ZIP export.
6. Test QR generation after disconnecting your computer from the internet **only if the site was visited while online and its service worker finished caching**.

For more checks, see [ACCEPTANCE_TESTS.md](ACCEPTANCE_TESTS.md).

## Part E — Updating later

1. Edit the files under `public/` in your local extracted folder.
2. In the same repository, use GitHub web upload to replace files, GitHub Desktop, or run:

```powershell
git add .
git commit -m "Update QR Studio"
git push
```

3. Cloudflare Pages automatically builds and publishes updates from the connected `main` branch.
4. If an older version appears, refresh the page once; the service worker is designed to update cached assets on activation, though an existing tab may need a reload.

## Cost / expiration honesty

- We use **static Pages hosting**, no Functions, paid storage, R2 bucket, database, SMS gateway or paid QR subscription.
- Cloudflare currently lists unlimited free static asset requests and Free-plan limits including **500 Pages builds/month**. Those platform limits may change. See official docs:
  - https://developers.cloudflare.com/pages/functions/pricing/
  - https://developers.cloudflare.com/pages/platform/limits/
- The `*.pages.dev` domain is included with the Pages site; purchasing a custom domain is optional, not required.
- User files remain on their **own** cloud storage (Google Drive, OneDrive, Dropbox etc.) and may be subject to the provider's sharing settings and storage limits.
- The **static QR image** can remain valid indefinitely; the website behind it may not.

## Troubleshooting

| Problem | Check |
|---|---|
| 404 on root website | Repository should contain `public/index.html`; Cloudflare Build output directory must equal `public`. |
| Blank layout / missing script | Confirm `public/assets/css/styles.css` and `public/assets/js/*.js` were all uploaded; reload. |
| Deployment tries to build with npm | Framework **None**; command `exit 0`, not `npm run build`. |
| QR scan opens file access denied | Google Drive: file sharing needs `Anyone with the link` → `Viewer` if allowed; test as a logged-out viewer. |
| QR cannot be scanned | Use dark QR on white background, print at least roughly 2.5 cm wide, keep quiet margin, and consider removing logo. |
| No automatic QR scan check | BarcodeDetector is not available in that browser; manually scan with phone. |
| Changes do not appear | Check latest Cloudflare deployment and browser service-worker cache; reload or close/reopen. |
| Your Cloudflare project name is taken | Choose a unique project name; do not assume `qr-studio.pages.dev` will be assigned. |
