# Deploy Phase 2 to your existing Free QR Studio website

**Production website:** https://freeqrstudio.pages.dev/  
**Recommended approach:** Deploy and test a GitHub **preview branch**, then merge when accepted.

## Before changing anything

1. Sign in to GitHub and open the repository connected to **freeqrstudio.pages.dev**. You do **not** need a new repository or a new Cloudflare Pages project.
2. Verify `main` currently contains a top-level `public/` folder with `index.html`, `assets/`, `_headers`, and `sw.js`.
3. Download a backup ZIP of the current GitHub `main` branch: **Code → Download ZIP**.
4. Unzip the new Phase 2 source ZIP. Do not upload the Phase 2 ZIP as one file into `public/`; upload its **contents** with their original folder structure.

## Recommended: GitHub browser upload (without local developer tools)

1. In the GitHub repository, open the **branch selector** (`main`) and create a branch named `phase2-design` from `main`.
2. On that branch, choose **Add file → Upload files**. Drag the **contents of the extracted Phase 2 package** (`public`, `docs`, `tests`, `README.md`, etc.), maintaining the paths. Review the changed-file list and commit to `phase2-design`. GitHub's browser interface behavior may vary, so check that you did not create a nested `QR_Studio_Phase2/public` directory.
3. Open the repository root: `public/index.html` must exist. If the web interface refuses any replacements, use the Git workflow below instead of creating duplicate folders.
4. In Cloudflare → **Workers & Pages → freeqrstudio → Deployments**, find the new nonproduction branch preview. Open its `*.pages.dev` preview URL. You may need to enable preview-branch deployments if currently disabled.
5. Run **[ACCEPTANCE_TESTS.md](ACCEPTANCE_TESTS.md)** on that preview link.
6. When satisfied, open a pull request from `phase2-design` into `main`, review and merge it. The existing Cloudflare Git integration should automatically deploy the new `main` commit to `https://freeqrstudio.pages.dev/`.
7. Refresh the site after deployment; if the old UI persists, hard-refresh (`Ctrl+Shift+R`) or reopen in a private window. The updated service worker uses cache `qrstudio-static-v2.0.0`.

## Alternative: Git CLI / Windows PowerShell (most reliable)

```powershell
# Replace YOURNAME and REPOSITORY with the actual GitHub owner and repo.
git clone https://github.com/YOURNAME/REPOSITORY.git
cd REPOSITORY
git checkout -b phase2-design
# Copy the *contents* of the extracted Phase 2 folder here,
# overwriting public/, docs/, README.md and tests/ as needed.
git status
git add public docs tests README.md LICENSE THIRD_PARTY_NOTICES.md .gitignore
git commit -m "Phase 2: approved design, QR styling and light/dark themes"
git push -u origin phase2-design
```

Create a GitHub pull request after the Cloudflare preview passes acceptance. Do **not** switch the production branch just to test the preview.

## Verify Cloudflare Pages settings

These are unchanged from Phase 1:

- Framework preset: **None**
- Build command: **`exit 0`**
- Build output directory: **`public`**
- Root directory: **leave blank** (repository root)
- Environment variables: **none**

A nested repo path like `QR_Studio_Phase2/public` would require a different output path and is not recommended. Upload files into the repository root instead.

## If deployment fails

- If Cloudflare returns **404**, confirm `public/index.html` exists and output directory is `public`.
- If Cloudflare says **first deployment failed to start**, inspect the failed deployment details and GitHub integration permissions; the build command may not be the problem.
- If CSS/JS changes do not appear, inspect the browser console for 404s and confirm service worker cache refreshed.
- If `public` shows as an empty folder in GitHub, retry with the folder contents, not only the ZIP.
- If there is a regression, restore `main` to its last approved commit or use GitHub **Revert**, then wait for Cloudflare's automatic production deploy.

Official documentation: https://developers.cloudflare.com/pages/configuration/git-integration/ and https://developers.cloudflare.com/pages/framework-guides/deploy-anything/.
