# dataxmatrix-site

Official website for **Iris** (school management desktop app for Palestinian schools), served at https://dataxmatrix.com via GitHub Pages. Bilingual: English (LTR) at the root, Arabic (RTL) under `/ar/`. Static only — no server, no database.

## Hard rules

- **Never read or modify `~/projects/iris`** (the app's private code repo).
- **Never modify `~/projects/dataxmatrix` or `~/projects/dataxmatrix-web`** (the retired DataXMatrix price-monitoring project). No VPS/server from now on: static hosting only.
- **Iris is distributed only through the Microsoft Store** (Store ID `9P5FQXQH4HF3`). The direct installers are retired: never publish an installer in `novaxmatrix-cell/iris-releases` or link to one from the site.
- Every download button and link goes to the Store (`STORE_URL` in `build.mjs`) or to `/download/`, which points to the Store.

## Layout

- `build.mjs` — zero-dependency build → `dist/`. `node build.mjs` (or `npm run build`).
- `serve.mjs` — local preview of `dist/` at http://localhost:8080 (`npm run preview` builds + serves).
- `src/layout.html` — shared head/header/footer; its interface strings come from `STR` in `build.mjs`.
- `src/pages/en/**.html` → `/…`, `src/pages/ar/**.html` → `/ar/…`. Each starts with `<!--meta {"title","description","nav"} -->`. `{{TOKENS}}` (WhatsApp links, Store link, guide videos…) are defined in `build.mjs`; unknown tokens fail the build. In Arabic pages write links as `/download/`; the build rewrites them to `/ar/download/`. Keep both languages in step: same pages, same claims.
- Language: header switch links to the counterpart page and saves the choice (`localStorage.lang`). English pages send a first-time visitor with an Arabic browser (or a saved `ar` choice) to the Arabic page; Arabic pages never redirect; bots never redirect.
- `REDIRECTS` in `build.mjs` keeps old Arabic URLs alive: `/files/` and the app's `/guide/<slug>/` links redirect to `/ar/…`. English has a single `/guide/` page (videos are Arabic).
- `src/assets/` — CSS, JS, images (copied as-is). Colors are CSS tokens in `site.css`; dark theme redefines them.
- `data/releases.json` — history of the retired direct installers, plus the system requirements shown in the FAQ. Not rendered as downloads. `/download/latest/` (old stable link) redirects to the Store. `/updates/latest.json` is read by direct installs rc.3–rc.5: `STORE_MOVE` in `build.mjs` keeps its schema and field types and tells them, in Arabic, that Iris moved to the Store (their «تنزيل» button opens only dataxmatrix.com links). Never delete it.
- `data/guide.json` — the video guide chapters, with `_en` fields for the English page.
- `design/iris-site-mockup.html` — the approved design draft (reference only, not published).
- `design/iris-logo-986.png` — full-size logo, the source for all icons. `python3 tools/make-icons.py` regenerates `logo.png`, favicons and the 180px phone icon; `design/og-image.html` is the source of the 1200×630 link-preview card `og.png`, and `design/og-image-en.html` of `og-en.png` (render commands in their header comments).
- `.github/workflows/deploy.yml` — builds and deploys to Pages on push to `main`.

## Releasing a new version

Releases go through the Microsoft Store (Partner Center). The site needs no change for a release.

## Conventions

- Guide URLs (`/guide/<slug>/`) are linked from the app's «دليل الاستخدام» button — never rename or remove a slug (they redirect to `/ar/guide/<slug>/`).
- Brand names are always in Latin letters: «Iris», «DataX Matrix». Say «نظام الوزارة» / “the Ministry system”, never eSchool by name.
- Keep it light for weak school PCs: self-hosted subset fonts (IBM Plex Sans Arabic for Arabic, IBM Plex Sans for English), no frameworks, tiny JS, images as WebP with width/height. Lighthouse mobile ≥ 90.
- Contact: only WhatsApp `+972568806666` (wa.me/972568806666), email `info@dataxmatrix.com` (general) and `support@dataxmatrix.com` (technical support), and the site itself. Never write an address, city, region or country tied to the owner or business anywhere (pages, meta, schema, images, JSON). «للمدارس الفلسطينية» is fine only as the target market.
- Planned, not built: promo video page (`/video/`).
