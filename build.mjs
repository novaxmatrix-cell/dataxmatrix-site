// Builds the static site into dist/. No dependencies; Node 18+.
//
// The site is bilingual. English pages live in src/pages/en/** and are served at the root;
// Arabic pages live in src/pages/ar/** and are served under /ar/. Each page starts with a meta comment:
//   <!--meta {"title": "...", "description": "...", "nav": "download"} -->
// and may use {{TOKENS}} (see `tokens` below). The result is wrapped in src/layout.html.
// In Arabic pages, root-relative links (href="/download/") are rewritten to /ar/… at build time.
// Release info comes from data/releases.json (newest first), the video guide from data/guide.json.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const SITE_URL = 'https://dataxmatrix.com';
const DOMAIN = 'dataxmatrix.com';
const WHATSAPP = '972568806666';
const LANGS = ['en', 'ar'];
const PREFIX = { en: '', ar: '/ar' };
// Iris is distributed only through the Microsoft Store. The direct installers are retired; data/releases.json keeps their history.
// The Store URL carries no parameters (no locale hint, no tracking); the Store picks the visitor's language itself.
const STORE_URL = { en: 'https://apps.microsoft.com/detail/9P5FQXQH4HF3', ar: 'https://apps.microsoft.com/detail/9P5FQXQH4HF3' };
// The NovaX Matrix YouTube channel (DataX Matrix is part of NovaX Matrix). No video is embedded on the site; this is a plain link.
const YOUTUBE_URL = 'https://www.youtube.com/@NovaX-Matrix';

// Old Arabic URLs that moved. The app links to /guide/<slug>/, so those must keep working.
const REDIRECTS = {
  '/files/': '/ar/forms/',
  '/guide/getting-started/': '/ar/guide/getting-started/',
  '/guide/eschool-import/': '/ar/guide/eschool-import/',
  '/guide/attendance/': '/ar/guide/attendance/',
};

// ---------- interface strings ----------
const STR = {
  en: {
    dir: 'ltr', ogLocale: 'en_US', ogImage: 'og-en.png', switchLabel: 'English',
    homeTitle: 'DataX Matrix · Iris, school management software', titleSuffix: ' – Iris',
    nav: { home: 'Home', download: 'Download', activation: 'Activation & pricing', guide: 'User guide', forms: 'Forms & FAQ', contact: 'Contact' },
    privacy: 'Privacy policy',
    skip: 'Skip to content', navAria: 'Main menu', footerNavAria: 'Footer links', downloadBtn: 'Download Iris',
    themeAria: 'Toggle dark mode', menuAria: 'Menu', ogAlt: 'Iris logo – run your whole school in one program',
    footerAbout: 'School management software for Palestinian government and private schools. Works offline, and the school’s data stays at the school.',
    links: 'Links', contact: 'Contact us', whatsapp: 'WhatsApp', support: 'Technical support', tagline: 'For Palestinian government and private schools',
    familyUrl: 'https://novaxmatrix.com/', family: 'DataX Matrix is part of NovaX Matrix',
    fonts: ['IBMPlexSans-Regular', 'IBMPlexSans-Bold'],
    storeAlt: 'Download from the Microsoft Store', storeLink: 'Iris on the Microsoft Store', youtubeLink: 'NovaX Matrix on YouTube',
    videoAria: 'Video: ', tocAria: 'Guide contents',
  },
  ar: {
    dir: 'rtl', ogLocale: 'ar_AR', ogImage: 'og.png', switchLabel: 'العربية',
    homeTitle: 'DataX Matrix · Iris – نظام إدارة المدرسة', titleSuffix: ' – Iris',
    nav: { home: 'الرئيسية', download: 'التنزيل', activation: 'التفعيل والأسعار', guide: 'دليل الاستخدام', forms: 'النماذج والأسئلة', contact: 'تواصل معنا' },
    privacy: 'سياسة الخصوصية',
    skip: 'تخطَّ إلى المحتوى', navAria: 'القائمة الرئيسية', footerNavAria: 'روابط التذييل', downloadBtn: 'تنزيل Iris',
    themeAria: 'تبديل الوضع الليلي', menuAria: 'القائمة', ogAlt: 'شعار Iris – إدارة المدرسة كلها في برنامج واحد',
    footerAbout: 'نظام إدارة مدرسية للمدارس الفلسطينية الحكومية والخاصة. يعمل بدون إنترنت، وبيانات المدرسة تبقى في المدرسة.',
    links: 'روابط', contact: 'تواصل معنا', whatsapp: 'واتساب', support: 'الدعم الفني', tagline: 'للمدارس الفلسطينية الحكومية والخاصة',
    familyUrl: 'https://novaxmatrix.com/ar/', family: '<bdi dir="ltr">DataX Matrix</bdi> جزء من <bdi dir="ltr">NovaX Matrix</bdi>',
    fonts: ['IBMPlexSansArabic-Regular', 'IBMPlexSansArabic-Bold'],
    storeAlt: 'التنزيل من Microsoft Store', storeLink: 'Iris على Microsoft Store', youtubeLink: 'قناة <bdi dir="ltr">NovaX Matrix</bdi> على YouTube',
    videoAria: 'فيديو: ', tocAria: 'محتويات الدليل',
  },
};
const NAV = [['home', '/'], ['download', '/download/'], ['activation', '/activation/'], ['guide', '/guide/'], ['forms', '/forms/'], ['contact', '/contact/']];

// Prefilled WhatsApp messages.
const WA_TEXT = {
  en: {
    WA_URL: 'Hello, I’m contacting you about Iris for our school.',
    WA_TRIAL_URL: 'Hello, we’d like to try Iris at our school.\nSchool name: \nCity: ',
    WA_DEMO_URL: 'Hello, we’d like a demo of Iris for our school.\nSchool name: \nCity: ',
    WA_PRIVATE_TRIAL_URL: 'Hello, we’re a private school and would like to try Iris for free.\nSchool name: \nCity: \nApprox. number of students: ',
    WA_QUOTE_URL: 'Hello, we’d like a price quote for Iris.\nSchool name: \nCity: \nApprox. number of students: ',
    WA_ACTIVATE_URL: 'Hello, I’d like to activate Iris.\nSchool name: \nRequest code: ',
    WA_REPORT_URL: 'Hello, I’d like to report a problem with Iris.\nSchool name: \nIris version: \nWhat happened: \n(I’ll attach a screenshot)',
  },
  ar: {
    WA_URL: 'مرحباً، أتواصل بخصوص برنامج Iris لمدرستنا.',
    WA_TRIAL_URL: 'مرحباً، نرغب بتجربة برنامج Iris في مدرستنا.\nاسم المدرسة: \nالمدينة: ',
    WA_DEMO_URL: 'مرحباً، نرغب بعرض لبرنامج Iris في مدرستنا.\nاسم المدرسة: \nالمدينة: ',
    WA_PRIVATE_TRIAL_URL: 'مرحباً، نحن مدرسة خاصة ونرغب بتجربة برنامج Iris مجاناً.\nاسم المدرسة: \nالمدينة: \nعدد الطلاب تقريباً: ',
    WA_QUOTE_URL: 'مرحباً، نرغب بعرض سعر لبرنامج Iris.\nاسم المدرسة: \nالمدينة: \nعدد الطلاب تقريباً: ',
    WA_ACTIVATE_URL: 'مرحباً، أرغب بتفعيل برنامج Iris.\nاسم المدرسة: \nرمز الطلب: ',
    WA_REPORT_URL: 'مرحباً، أود الإبلاغ عن مشكلة في برنامج Iris.\nاسم المدرسة: \nإصدار البرنامج: \nوصف المشكلة: \n(سأرفق صورة للشاشة)',
  },
};

// ---------- helpers ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const wa = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
const ltr = (s) => `<bdi dir="ltr">${esc(s)}</bdi>`;
const fmtDate = (iso) => { const [y, m, d] = iso.split('-'); return ltr(`${d}/${m}/${y}`); };
// English text quoting the app's Arabic labels: the text inside «…» is isolated as right-to-left.
const enText = (s) => esc(s).replace(/«([^»]*)»/g, '«<bdi lang="ar" dir="rtl">$1</bdi>»');
const text = (s, lang) => (lang === 'en' ? enText(s) : esc(s));
const pick = (obj, key, lang) => (lang === 'en' ? obj[`${key}_en`] : obj[key]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

function fail(msg) { console.error(`build failed: ${msg}`); process.exit(1); }

// ---------- releases ----------
const rel = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/releases.json'), 'utf8'));
for (const r of rel.releases) {
  for (const k of ['version', 'date', 'file', 'size', 'sha256', 'notes', 'notes_en']) if (r[k] == null) fail(`release ${r.version ?? '?'} is missing "${k}"`);
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(r.version)) fail(`bad version "${r.version}"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) fail(`bad date "${r.date}" (use YYYY-MM-DD)`);
  if (!/^[0-9a-f]{64}$/i.test(r.sha256)) fail(`bad sha256 for ${r.version}`);
  for (const k of ['notes', 'notes_en']) if (!Array.isArray(r[k]) || !r[k].length) fail(`release ${r.version} needs at least one entry in "${k}"`);
}
if (!rel.requirements_en || rel.requirements_en.length !== rel.requirements.length) fail('releases.json: "requirements_en" must match "requirements"');
const lastInstaller = rel.releases[0] || fail('releases.json: keep the last installer entry (latest.json reuses its size and sha256)');

const reqList = (lang) => pick(rel, 'requirements', lang)
  .map((x) => `<li>${lang === 'ar' ? esc(x).replace(/\d+(?:-bit| GB)\b/g, (m) => `<bdi dir="ltr">${m}</bdi>`) : esc(x)}</li>`).join('');

// Microsoft's official badge, unchanged (self-hosted): dark on the light theme, light on the dark theme.
const storeBadge = (lang) => `<a class="msb" href="${esc(STORE_URL[lang])}" rel="noopener">${['dark', 'light'].map((v) =>
  `<img class="msb-${v}" src="/assets/img/store/ms-store-${lang}-${v}.svg" width="161" height="44" alt="${v === 'dark' ? STR[lang].storeAlt : ''}">`).join('')}</a>`;

// ---------- guide (data/guide.json → /guide/, /ar/guide/ and the Arabic chapter pages) ----------
const guide = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guide.json'), 'utf8'));
for (const c of guide) {
  for (const k of ['id', 'title', 'intro', 'video', 'steps', 'title_en', 'intro_en', 'steps_en']) if (c[k] == null) fail(`guide chapter ${c.id ?? '?'} is missing "${k}"`);
  for (const ext of ['mp4', 'webp']) {
    if (!fs.existsSync(path.join(SRC, `assets/guide/${c.video}.${ext}`))) fail(`guide chapter ${c.id}: assets/guide/${c.video}.${ext} not found`);
  }
}
const guideBody = (c, lang) => `<div class="chap-body">
  <div class="vid"><video controls preload="none" playsinline width="1920" height="1080" data-poster="/assets/guide/${esc(c.video)}.webp" aria-label="${STR[lang].videoAria}${esc(pick(c, 'title', lang))}"><source src="/assets/guide/${esc(c.video)}.mp4" type="video/mp4"></video></div>
  <ol class="howto">${pick(c, 'steps', lang).map((s) => `<li>${text(s, lang)}</li>`).join('')}</ol>
 </div>`;
const guideToc = (lang) => `<nav class="toc" aria-label="${STR[lang].tocAria}"><ol>${guide.map((c) => `<li><a href="#${esc(c.id)}">${esc(pick(c, 'title', lang))}</a></li>`).join('')}</ol></nav>`;
const guideChapters = (lang) => guide.map((c, i) => `<div class="chap" id="${esc(c.id)}">
 <h2><span class="num">${i + 1}</span>${esc(pick(c, 'title', lang))}</h2>
 <p class="sub">${esc(pick(c, 'intro', lang))}</p>
 ${guideBody(c, lang)}
</div>`).join('\n');

// ---------- tokens available in pages ----------
function tokensFor(lang) {
  const t = {
    WA_DISPLAY: () => (lang === 'en' ? '<span class="ltr">+972 56 880 6666</span>' : '<span class="ltr">056-880-6666</span>'),
    STORE_URL: () => esc(STORE_URL[lang]),
    STORE_URL_AR: () => esc(STORE_URL.ar),
    STORE_BADGE: () => storeBadge(lang),
    YOUTUBE_URL: () => esc(YOUTUBE_URL),
    REQUIREMENTS: () => reqList(lang),
    GUIDE_TOC: () => guideToc(lang),
    GUIDE_CHAPTERS: () => guideChapters(lang),
  };
  for (const [k, msg] of Object.entries(WA_TEXT[lang])) t[k] = () => esc(wa(msg));
  // {{GUIDE_<ID>}} renders one chapter's video and steps (used by /ar/guide/<slug>/ pages).
  for (const c of guide) t[`GUIDE_${c.id.toUpperCase()}`] = () => guideBody(c, lang);
  return t;
}
const applyTokens = (s, lang) => {
  const tokens = tokensFor(lang);
  return s.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => {
    if (!tokens[k]) fail(`unknown token ${m}`);
    return tokens[k]();
  });
};
// Root-relative page links in Arabic pages point to the Arabic site.
const localize = (html, lang) => (lang === 'ar'
  ? html.replace(/href="\/(?!assets\/|ar\/|favicon)([^"]*)"/g, 'href="/ar/$1"')
  : html);

// ---------- pages ----------
const pagesDir = path.join(SRC, 'pages');
const pages = [];
for (const lang of LANGS) {
  for (const file of walk(path.join(pagesDir, lang)).filter((f) => f.endsWith('.html'))) {
    const relPath = path.relative(path.join(pagesDir, lang), file).replace(/\\/g, '/');
    if (relPath === '404.html' && lang !== 'en') fail('only src/pages/en/404.html is published (GitHub Pages serves one 404 page)');
    const raw = fs.readFileSync(file, 'utf8');
    const m = raw.match(/^<!--meta\s+(\{[\s\S]*?\})\s*-->\s*/);
    if (!m) fail(`${lang}/${relPath} has no <!--meta {...} --> header`);
    const key = '/' + relPath.replace(/index\.html$/, '');
    pages.push({ lang, relPath, key, meta: JSON.parse(m[1]), body: raw.slice(m[0].length), urlPath: PREFIX[lang] + key });
  }
}
const byKey = (lang, key) => pages.find((p) => p.lang === lang && p.key === key);
// The equivalent page in the other language. English has one guide page; Arabic chapters map to its sections.
function counterpart(p) {
  const other = p.lang === 'en' ? 'ar' : 'en';
  if (byKey(other, p.key)) return { url: PREFIX[other] + p.key, exact: true };
  const chap = guide.find((c) => c.page === p.key);
  if (chap && other === 'en') return { url: `/guide/#${chap.id}`, exact: false };
  return { url: PREFIX[other] + '/', exact: false };
}

// ---------- build ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(path.join(SRC, 'assets'), path.join(DIST, 'assets'), { recursive: true });
fs.copyFileSync(path.join(SRC, 'favicon.ico'), path.join(DIST, 'favicon.ico'));

const assetVersion = crypto.createHash('sha1')
  .update(fs.readFileSync(path.join(SRC, 'assets/css/site.css')))
  .update(fs.readFileSync(path.join(SRC, 'assets/js/site.js')))
  .digest('hex').slice(0, 8);
const layout = fs.readFileSync(path.join(SRC, 'layout.html'), 'utf8');
const sitemap = [];

for (const p of pages) {
  const t = STR[p.lang];
  const is404 = p.relPath === '404.html';
  const alt = counterpart(p);
  const otherLang = p.lang === 'en' ? 'ar' : 'en';
  const alternates = alt.exact && !is404
    ? [['en', p.lang === 'en' ? p.urlPath : alt.url], ['ar', p.lang === 'ar' ? p.urlPath : alt.url]]
      .map(([l, u]) => `<link rel="alternate" hreflang="${l}" href="${SITE_URL + u}">`).join('\n')
      + `\n<link rel="alternate" hreflang="x-default" href="${SITE_URL + (p.lang === 'en' ? p.urlPath : alt.url)}">`
    : '';
  // First visit with an Arabic browser, or a saved Arabic choice: go to the Arabic page. Bots never redirect.
  const langRedirect = p.lang === 'en' && !is404
    ? `<script>try{var L=localStorage.getItem('lang');if(L==='ar'||(L===null&&/^ar(-|$)/i.test(navigator.language||'')&&!navigator.webdriver&&!/bot|crawl|spider|slurp|preview|lighthouse|headless|facebookexternalhit|whatsapp|telegram/i.test(navigator.userAgent))){localStorage.setItem('lang','ar');location.replace('${alt.url}'+(location.hash||''))}}catch(e){}</script>\n`
    : '';
  const nav = NAV.map(([key, href]) =>
    `  <a href="${href}"${key === p.meta.nav ? ' aria-current="page"' : ''}>${t.nav[key]}</a>`).join('\n');
  const vars = {
    lang: p.lang,
    dir: t.dir,
    title: esc(p.meta.title === 'Iris' ? t.homeTitle : `${p.meta.title}${t.titleSuffix}`),
    description: esc(p.meta.description),
    canonical: SITE_URL + (is404 ? '/' : p.urlPath),
    siteUrl: SITE_URL,
    ogImage: t.ogImage,
    ogAlt: esc(t.ogAlt),
    ogLocale: t.ogLocale,
    fontPreload: t.fonts.map((f) => `<link rel="preload" href="/assets/fonts/${f}.woff2" as="font" type="font/woff2" crossorigin>`).join('\n'),
    alternates,
    langRedirect,
    skip: t.skip, navAria: t.navAria, footerNavAria: t.footerNavAria, downloadBtn: t.downloadBtn, storeUrl: esc(STORE_URL[p.lang]),
    storeLink: t.storeLink, youtubeUrl: esc(YOUTUBE_URL), youtubeLink: t.youtubeLink,
    themeAria: t.themeAria, menuAria: t.menuAria,
    footerAbout: t.footerAbout, links: t.links, contactHead: t.contact, whatsapp: t.whatsapp, support: t.support, tagline: t.tagline, familyUrl: t.familyUrl, family: t.family,
    navDownload: t.nav.download, navGuide: t.nav.guide, navForms: t.nav.forms, navActivation: t.nav.activation, navPrivacy: t.privacy,
    nav,
    year: String(new Date().getFullYear()),
    assetVersion,
    content: applyTokens(p.body, p.lang),
  };
  const switchVars = {
    switchUrl: alt.url, switchLang: otherLang, switchLabel: STR[otherLang].switchLabel,
  };
  let html = layout.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in switchVars ? m : (vars[k] ?? fail(`layout var {{${k}}} not set`))));
  html = localize(html, p.lang).replace(/\{\{(\w+)\}\}/g, (_, k) => switchVars[k] ?? fail(`layout var {{${k}}} not set`));
  const out = path.join(DIST, PREFIX[p.lang], p.relPath);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  if (!is404) sitemap.push(SITE_URL + p.urlPath);
}

// Redirect stubs for old Arabic URLs (static: meta refresh + JS that keeps the #hash).
for (const [from, to] of Object.entries(REDIRECTS)) {
  if (pages.some((p) => p.urlPath === from)) fail(`redirect ${from} collides with a page`);
  if (!pages.some((p) => p.urlPath === to)) fail(`redirect ${from} → ${to}: target page missing`);
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Iris</title><link rel="canonical" href="${SITE_URL + to}"><meta http-equiv="refresh" content="0; url=${to}">
<script>location.replace('${to}'+(location.hash||''))</script>
</head><body><p><a href="${to}">${SITE_URL + to}</a></p></body></html>\n`;
  fs.mkdirSync(path.join(DIST, from), { recursive: true });
  fs.writeFileSync(path.join(DIST, from, 'index.html'), html);
}

// /download/latest/ — old stable link to the newest installer. Iris is Store-only now, so it sends people to the Store.
{
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Iris في Microsoft Store</title><meta http-equiv="refresh" content="0; url=${esc(STORE_URL.ar)}">
<style>body{font-family:"Segoe UI",Tahoma,sans-serif;background:#F7F6F2;color:#1F2A28;padding:40px 16px;text-align:center}a{color:#0F766E}</style>
</head><body><p>يتوفر Iris الآن من <bdi dir="ltr">Microsoft Store</bdi> فقط. <a href="${esc(STORE_URL.ar)}">افتح صفحة Iris في المتجر</a>.</p></body></html>\n`;
  fs.mkdirSync(path.join(DIST, 'download/latest'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'download/latest/index.html'), html);
}

// /updates/latest.json — read by direct installs rc.3–rc.5 (rc.2 has no update check). Same schema and field types they expect:
// a `version` newer than theirs shows «يتوفر تحديث Iris <version>» with `notes`, and «تنزيل» opens only dataxmatrix.com links,
// so `url` and `page` lead to the Store through /download/latest/ and /ar/download/. `size` and `sha256` stay those of the
// last installer only to keep the types; nothing downloads it. Store builds update through the Store.
const STORE_MOVE = {
  version: '1.0.0-rc.6',
  date: '2026-10-20',
  notes: [
    'انتقل Iris إلى Microsoft Store، ومن هناك تصلك التحديثات تلقائياً. نسخ ملف التثبيت المباشر لن تصلها تحديثات بعد الآن.',
    'اضغط «تنزيل» لفتح صفحة Iris في المتجر، أو افتح: apps.microsoft.com/detail/9P5FQXQH4HF3',
    'قبل الانتقال، خذ نسخة احتياطية من داخل البرنامج، ثم استعدها في نسخة المتجر. إذا لم تظهر بياناتك تواصلوا معنا.',
  ],
};
{
  const body = {
    schema: 1,
    latest: {
      version: STORE_MOVE.version, date: STORE_MOVE.date, url: `${SITE_URL}/download/latest/`,
      size: lastInstaller.size, sha256: lastInstaller.sha256, notes: STORE_MOVE.notes,
      page: `${SITE_URL}/ar/download/`,
    },
  };
  fs.mkdirSync(path.join(DIST, 'updates'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'updates/latest.json'), JSON.stringify(body, null, 2) + '\n');
}

fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.sort().map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
fs.writeFileSync(path.join(DIST, 'CNAME'), DOMAIN + '\n');
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

console.log(`built ${pages.length} pages (${LANGS.join(' + ')}) and ${Object.keys(REDIRECTS).length} redirects into dist/ — Store-only; latest.json announces the move (${STORE_MOVE.version})`);
