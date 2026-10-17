// Builds the static site into dist/. No dependencies; Node 18+.
//
// Pages live in src/pages/**.html. Each starts with a meta comment:
//   <!--meta {"title": "...", "description": "...", "nav": "download"} -->
// and may use {{TOKENS}} (see `tokens` below). The result is wrapped in src/layout.html.
// Release info comes from data/releases.json (newest first).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const SITE_URL = 'https://dataxmatrix.com';
const DOMAIN = 'dataxmatrix.com';
const WHATSAPP = '972568806666';

const NAV = [
  ['home', '/', 'الرئيسية'],
  ['download', '/download/', 'التنزيل'],
  ['activation', '/activation/', 'التفعيل والأسعار'],
  ['guide', '/guide/', 'دليل الاستخدام'],
  ['files', '/files/', 'النماذج والأسئلة'],
  ['contact', '/contact/', 'تواصل معنا'],
];

// ---------- helpers ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const wa = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
const ltr = (s) => `<bdi dir="ltr">${esc(s)}</bdi>`;
const fmtDate = (iso) => { const [y, m, d] = iso.split('-'); return ltr(`${d}/${m}/${y}`); };
const fmtSize = (bytes) => `${ltr(Math.round(bytes / 1048576))} ميغابايت`;

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
  for (const k of ['version', 'date', 'file', 'size', 'sha256', 'notes']) if (r[k] == null) fail(`release ${r.version ?? '?'} is missing "${k}"`);
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(r.version)) fail(`bad version "${r.version}"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) fail(`bad date "${r.date}" (use YYYY-MM-DD)`);
  if (!/^[0-9a-f]{64}$/i.test(r.sha256)) fail(`bad sha256 for ${r.version}`);
  if (!Array.isArray(r.notes) || !r.notes.length) fail(`release ${r.version} needs at least one note`);
  r.url = r.url || `https://github.com/${rel.repo}/releases/download/v${r.version}/${r.file}`;
}
const latest = rel.releases[0] || null;

const reqList = rel.requirements.map((x) => `<li>${esc(x).replace(/\d+(?:-bit| GB)\b/g, (m) => `<bdi dir="ltr">${m}</bdi>`)}</li>`).join('');

function downloadBox() {
  if (!latest) {
    return `<div class="dlbox">
  <span class="badge">قريباً</span>
  <h2>Iris لـ Windows</h2>
  <div class="v">النسخة الأولى للمدارس قيد التجهيز وستكون متاحة للتنزيل هنا قريباً.</div>
  <a class="btn ba" href="${esc(wa('مرحباً، أرغب بأن تبلغوني عند صدور برنامج Iris لمدرستنا.'))}" rel="noopener">أبلغوني عند صدوره عبر واتساب</a>
  <ul>${reqList}</ul>
 </div>`;
  }
  return `<div class="dlbox">
  <h2>Iris لـ Windows</h2>
  <div class="v">الإصدار ${ltr(latest.version)} · ${fmtDate(latest.date)} · ${fmtSize(latest.size)}</div>
  <a class="btn ba" href="${esc(latest.url)}">⬇ تنزيل ${ltr(latest.file)}</a>
  <details class="verify">
   <summary>التحقق من سلامة الملف</summary>
   <p>قارن هذه البصمة ببصمة الملف بعد تنزيله، فإن تطابقت فالملف سليم كما نشرناه.</p>
   <div class="hashrow"><code class="hash" id="sha256">${esc(latest.sha256)}</code><button class="copy" type="button" data-copy="sha256" aria-label="نسخ بصمة SHA-256">نسخ</button></div>
   <small><bdi dir="ltr">SHA-256</bdi> · في PowerShell: <bdi dir="ltr">Get-FileHash ${esc(latest.file)}</bdi></small>
  </details>
  <ul>${reqList}</ul>
 </div>`;
}

function changelog(limit) {
  const list = limit ? rel.releases.slice(0, limit) : rel.releases;
  if (!list.length) return `<div class="item">لا توجد إصدارات منشورة بعد.</div>`;
  return list.map((r) => `<div class="item" id="v${esc(r.version)}"><b>${ltr(r.version)}</b> <small>${fmtDate(r.date)}</small>
   <ul>${r.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>`).join('\n');
}

// ---------- guide (data/guide.json → /guide/ and its chapter pages) ----------
const guide = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/guide.json'), 'utf8'));
for (const c of guide) {
  for (const k of ['id', 'title', 'intro', 'video', 'steps']) if (c[k] == null) fail(`guide chapter ${c.id ?? '?'} is missing "${k}"`);
  for (const ext of ['mp4', 'webp']) {
    if (!fs.existsSync(path.join(SRC, `assets/guide/${c.video}.${ext}`))) fail(`guide chapter ${c.id}: assets/guide/${c.video}.${ext} not found`);
  }
}
const guideBody = (c) => `<div class="chap-body">
  <div class="vid"><video controls preload="none" playsinline width="1920" height="1080" data-poster="/assets/guide/${esc(c.video)}.webp" aria-label="فيديو: ${esc(c.title)}"><source src="/assets/guide/${esc(c.video)}.mp4" type="video/mp4"></video></div>
  <ol class="howto">${c.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
 </div>`;
const guideToc = () => `<nav class="toc" aria-label="محتويات الدليل"><ol>${guide.map((c) => `<li><a href="#${esc(c.id)}">${esc(c.title)}</a></li>`).join('')}</ol></nav>`;
const guideChapters = () => guide.map((c, i) => `<div class="chap" id="${esc(c.id)}">
 <h2><span class="num">${i + 1}</span>${esc(c.title)}</h2>
 <p class="sub">${esc(c.intro)}</p>
 ${guideBody(c)}
</div>`).join('\n');

// ---------- tokens available in pages ----------
const tokens = {
  WA_URL: () => esc(wa('مرحباً، أتواصل بخصوص برنامج Iris لمدرستنا.')),
  WA_TRIAL_URL: () => esc(wa('مرحباً، نرغب بتجربة برنامج Iris في مدرستنا.\nاسم المدرسة: \nالمدينة: ')),
  WA_PRIVATE_TRIAL_URL: () => esc(wa('مرحباً، نحن مدرسة خاصة ونرغب بتجربة برنامج Iris مجاناً.\nاسم المدرسة: \nالمدينة: \nعدد الطلاب تقريباً: ')),
  WA_QUOTE_URL: () => esc(wa('مرحباً، نرغب بعرض سعر لبرنامج Iris.\nاسم المدرسة: \nالمدينة: \nعدد الطلاب تقريباً: ')),
  WA_ACTIVATE_URL: () => esc(wa('مرحباً، أرغب بتفعيل برنامج Iris.\nاسم المدرسة: \nرمز الطلب: ')),
  WA_REPORT_URL: () => esc(wa('مرحباً، أود الإبلاغ عن مشكلة في برنامج Iris.\nاسم المدرسة: \nإصدار البرنامج: \nوصف المشكلة: \n(سأرفق صورة للشاشة)')),
  WA_DISPLAY: () => '<span class="ltr">056-880-6666</span>',
  DOWNLOAD_BOX: downloadBox,
  CHANGELOG: () => changelog(),
  CHANGELOG_SHORT: () => changelog(3),
  REQUIREMENTS: () => reqList,
  LATEST_VERSION: () => (latest ? ltr(latest.version) : 'قريباً'),
  GUIDE_TOC: guideToc,
  GUIDE_CHAPTERS: guideChapters,
};
// {{GUIDE_<ID>}} renders one chapter's video and steps (used by /guide/<slug>/ pages).
for (const c of guide) tokens[`GUIDE_${c.id.toUpperCase()}`] = () => guideBody(c);
const applyTokens = (s) => s.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => {
  if (!tokens[k]) fail(`unknown token ${m}`);
  return tokens[k]();
});

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
const pagesDir = path.join(SRC, 'pages');
const sitemap = [];

for (const file of walk(pagesDir).filter((f) => f.endsWith('.html'))) {
  const relPath = path.relative(pagesDir, file);
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^<!--meta\s+(\{[\s\S]*?\})\s*-->\s*/);
  if (!m) fail(`${relPath} has no <!--meta {...} --> header`);
  const meta = JSON.parse(m[1]);
  const urlPath = '/' + relPath.replace(/index\.html$/, '').replace(/\\/g, '/');
  const nav = NAV.map(([key, href, label]) =>
    `  <a href="${href}"${key === meta.nav ? ' aria-current="page"' : ''}>${label}</a>`).join('\n');
  const vars = {
    title: esc(meta.title === 'Iris' ? 'Iris – نظام إدارة المدرسة' : `${meta.title} – Iris`),
    description: esc(meta.description),
    canonical: SITE_URL + urlPath,
    siteUrl: SITE_URL,
    nav,
    year: String(new Date().getFullYear()),
    assetVersion,
    content: applyTokens(raw.slice(m[0].length)),
  };
  const html = layout.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? fail(`layout var {{${k}}} not set`));
  const out = path.join(DIST, relPath);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  if (relPath !== '404.html') sitemap.push(SITE_URL + urlPath);
}

// /download/latest/ — stable link to the newest installer (static redirect).
{
  const target = latest ? latest.url : '/download/';
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>تنزيل Iris</title><meta http-equiv="refresh" content="0; url=${esc(target)}">
<style>body{font-family:"Segoe UI",Tahoma,sans-serif;background:#F7F6F2;color:#1F2A28;padding:40px 16px;text-align:center}a{color:#0F766E}</style>
</head><body><p>${latest ? `جارٍ تنزيل Iris ${ltr(latest.version)}…` : 'لا توجد نسخة منشورة بعد.'} <a href="${esc(target)}">اضغط هنا إن لم يبدأ التحويل</a>.</p></body></html>\n`;
  fs.mkdirSync(path.join(DIST, 'download/latest'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'download/latest/index.html'), html);
}

// /updates/latest.json — reserved for in-app auto-update (not consumed yet).
{
  const body = {
    schema: 1,
    latest: latest && {
      version: latest.version, date: latest.date, url: latest.url,
      size: latest.size, sha256: latest.sha256, notes: latest.notes,
      page: `${SITE_URL}/download/`,
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

console.log(`built ${sitemap.length + 1} pages into dist/ — latest release: ${latest ? latest.version : 'none (download shows «قريباً»)'}`);
