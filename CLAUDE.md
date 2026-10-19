# dataxmatrix-site

Official website for **Iris** (school management desktop app for Palestinian schools), served at https://dataxmatrix.com via GitHub Pages. Bilingual: English (LTR) at the root, Arabic (RTL) under `/ar/`. Static only — no server, no database.

## Hard rules

- **Never read or modify `~/projects/iris`** (the app's private code repo).
- **Never modify `~/projects/dataxmatrix` or `~/projects/dataxmatrix-web`** (the retired DataXMatrix price-monitoring project). No VPS/server from now on: static hosting only.
- **`novaxmatrix-cell/iris-releases` holds school (production) installers only. Never publish test, dev, or internal builds there** — not as drafts, not as pre-releases. Every release there is something a school may download. Release candidates (e.g. `1.0.0-rc.1`) go there only when they are meant for schools.
- Only add an entry to `data/releases.json` after the installer is actually published in `iris-releases`.

## Layout

- `build.mjs` — zero-dependency build → `dist/`. `node build.mjs` (or `npm run build`).
- `serve.mjs` — local preview of `dist/` at http://localhost:8080 (`npm run preview` builds + serves).
- `src/layout.html` — shared head/header/footer; its interface strings come from `STR` in `build.mjs`.
- `src/pages/en/**.html` → `/…`, `src/pages/ar/**.html` → `/ar/…`. Each starts with `<!--meta {"title","description","nav"} -->`. `{{TOKENS}}` (WhatsApp links, download box, changelog…) are defined in `build.mjs`; unknown tokens fail the build. In Arabic pages write links as `/download/`; the build rewrites them to `/ar/download/`. Keep both languages in step: same pages, same claims.
- Language: header switch links to the counterpart page and saves the choice (`localStorage.lang`). English pages send a first-time visitor with an Arabic browser (or a saved `ar` choice) to the Arabic page; Arabic pages never redirect; bots never redirect.
- `REDIRECTS` in `build.mjs` keeps old Arabic URLs alive: `/files/` and the app's `/guide/<slug>/` links redirect to `/ar/…`. English has a single `/guide/` page (videos are Arabic).
- `src/assets/` — CSS, JS, images (copied as-is). Colors are CSS tokens in `site.css`; dark theme redefines them.
- `data/releases.json` — single source of truth for releases (newest first), with Arabic `notes` and English `notes_en`. Drives `/download/`, `/ar/download/`, `/download/latest/` (stable redirect to newest installer, used by the app) and `/updates/latest.json` (read by Iris: keep its schema and its Arabic notes unchanged).
- `data/guide.json` — the video guide chapters, with `_en` fields for the English page.
- `design/iris-site-mockup.html` — the approved design draft (reference only, not published).
- `design/iris-logo-986.png` — full-size logo, the source for all icons. `python3 tools/make-icons.py` regenerates `logo.png`, favicons and the 180px phone icon; `design/og-image.html` is the source of the 1200×630 link-preview card `og.png`, and `design/og-image-en.html` of `og-en.png` (render commands in their header comments).
- `.github/workflows/deploy.yml` — builds and deploys to Pages on push to `main`.

## Releasing a new installer

1. Create a release in `novaxmatrix-cell/iris-releases` with tag `v<version>` and upload `Iris-Setup-<version>.exe`.
2. Add an entry at the top of `data/releases.json`:
   `{"version": "1.0.0", "date": "YYYY-MM-DD", "file": "Iris-Setup-1.0.0.exe", "size": <bytes>, "sha256": "<hex>", "notes": ["…"], "notes_en": ["…"]}`
   (`url` is derived from the repo + tag + file; set it explicitly only if it differs.) `sha256sum` / `stat -c %s` give the hash and size.
3. Build, preview, push. With no releases the download page shows «قريباً».

## Conventions

- Guide URLs (`/guide/<slug>/`) are linked from the app's «دليل الاستخدام» button — never rename or remove a slug (they redirect to `/ar/guide/<slug>/`).
- Brand names are always in Latin letters: «Iris», «DataX Matrix». Say «نظام الوزارة» / “the Ministry system”, never eSchool by name.
- Keep it light for weak school PCs: self-hosted subset fonts (IBM Plex Sans Arabic for Arabic, IBM Plex Sans for English), no frameworks, tiny JS, images as WebP with width/height. Lighthouse mobile ≥ 90.
- Contact: only WhatsApp `+972568806666` (wa.me/972568806666), email `info@dataxmatrix.com` (general) and `support@dataxmatrix.com` (technical support), and the site itself. Never write an address, city, region or country tied to the owner or business anywhere (pages, meta, schema, images, JSON). «للمدارس الفلسطينية» is fine only as the target market.
- Planned, not built: promo video page (`/video/`), auto-update consumer of `/updates/latest.json`.
