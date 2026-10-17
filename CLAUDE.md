# dataxmatrix-site

Official website for **Iris** (school management desktop app for Palestinian schools), served at https://dataxmatrix.com via GitHub Pages. Arabic, RTL, static only — no server, no database.

## Hard rules

- **Never read or modify `~/projects/iris`** (the app's private code repo).
- **Never modify `~/projects/dataxmatrix` or `~/projects/dataxmatrix-web`** (the retired DataXMatrix price-monitoring project). No VPS/server from now on: static hosting only.
- **`novaxmatrix-cell/iris-releases` holds school (production) installers only. Never publish test, dev, or internal builds there** — not as drafts, not as pre-releases. Every release there is something a school may download. Release candidates (e.g. `1.0.0-rc.1`) go there only when they are meant for schools.
- Only add an entry to `data/releases.json` after the installer is actually published in `iris-releases`.

## Layout

- `build.mjs` — zero-dependency build → `dist/`. `node build.mjs` (or `npm run build`).
- `serve.mjs` — local preview of `dist/` at http://localhost:8080 (`npm run preview` builds + serves).
- `src/layout.html` — shared head/header/footer.
- `src/pages/**.html` — page bodies. Each starts with `<!--meta {"title","description","nav"} -->`. `{{TOKENS}}` (WhatsApp links, download box, changelog…) are defined in `build.mjs`; unknown tokens fail the build.
- `src/assets/` — CSS, JS, images (copied as-is). Colors are CSS tokens in `site.css`; dark theme redefines them.
- `data/releases.json` — single source of truth for releases (newest first). Drives `/download/`, `/download/latest/` (stable redirect to newest installer) and `/updates/latest.json` (reserved for future in-app auto-update).
- `design/iris-site-mockup.html` — the approved design draft (reference only, not published).
- `design/iris-logo-986.png` — full-size logo, the source for all icons. `python3 tools/make-icons.py` regenerates `logo.png`, favicons and the 180px phone icon; `design/og-image.html` is the source of the 1200×630 link-preview card `og.png` (render command in its header comment).
- `.github/workflows/deploy.yml` — builds and deploys to Pages on push to `main`.

## Releasing a new installer

1. Create a release in `novaxmatrix-cell/iris-releases` with tag `v<version>` and upload `Iris-Setup-<version>.exe`.
2. Add an entry at the top of `data/releases.json`:
   `{"version": "1.0.0", "date": "YYYY-MM-DD", "file": "Iris-Setup-1.0.0.exe", "size": <bytes>, "sha256": "<hex>", "notes": ["…"]}`
   (`url` is derived from the repo + tag + file; set it explicitly only if it differs.) `sha256sum` / `stat -c %s` give the hash and size.
3. Build, preview, push. With no releases the download page shows «قريباً».

## Conventions

- Guide URLs (`/guide/<slug>/`) are linked from the app's «دليل الاستخدام» button — never rename or remove a slug.
- Keep it light for weak school PCs: system fonts, no frameworks, tiny JS, images as WebP with width/height.
- Contact: only WhatsApp `+972568806666` (wa.me/972568806666) and the site itself. Never write an address, city, region or country tied to the owner or business anywhere (pages, meta, schema, images, JSON). «للمدارس الفلسطينية» is fine only as the target market.
- Planned, not built: promo video page (`/video/`), auto-update consumer of `/updates/latest.json`.
