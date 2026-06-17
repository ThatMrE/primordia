# Deploy — GitHub + Netlify

This is a static site (no build). Two ways to ship it: connect a GitHub repo to
Netlify (recommended — auto-deploys on every push), or drag-and-drop the folder.

---

## 1. Push to GitHub

From inside this folder:

```bash
git init
git add .
git commit -m "Primordia Grants site — Primordia Design System"
git branch -M main
git remote add origin https://github.com/<your-username>/primordia-grants.git
git push -u origin main
```

`build_site.py` is included so the site stays regenerable. `.gitignore` already
excludes OS cruft and `.netlify/`.

## 2. Connect to Netlify (recommended)

1. Netlify → **Add new site → Import an existing project → GitHub**.
2. Pick the `primordia-grants` repo.
3. Build settings — leave them empty / as detected:
   - **Build command:** *(blank)*
   - **Publish directory:** `.`
   `netlify.toml` already declares these, plus pretty-URL redirects, the custom
   404, security headers, and long-cache headers for `/assets/*`.
4. **Deploy.** Every push to `main` redeploys automatically.

### Alternative: drag-and-drop (no Git)
Netlify → **Sites → Add new site → Deploy manually**, then drag this whole folder
onto the drop zone. Fastest way to preview; no auto-deploy.

### Alternative: Netlify CLI
```bash
npm i -g netlify-cli
netlify deploy --dir . --prod
```

## 3. After first deploy

- **Custom domain:** Netlify → Domain settings → add `primordiagrants.com`
  (or a subdomain) and follow the DNS steps. HTTPS is automatic.
- **Forms:** the application form is Netlify-native. Confirm submissions land in
  **Site → Forms** (form name `grant-application`). Add a notification or wire it
  to the Primordia Grants Airtable base for review.
- **Fonts (optional):** to use licensed Futura instead of the Jost fallback, add
  `@font-face` rules to `assets/ds/fonts.css`.

## 4. Updating content later

Edit `build_site.py`, then:
```bash
python3 build_site.py
git commit -am "Update copy"
git push
```
Netlify rebuilds on push. Done.
