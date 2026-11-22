#!/usr/bin/env node
/*
 * Builds the Elevate Help site: one static, search-engine-ready HTML page per
 * guide, plus sitemap.xml, robots.txt and 404.html. No dependencies.
 *
 *   node scripts/build.mjs
 *   SITE_URL=https://help.era92elevate.org/ node scripts/build.mjs
 *
 * Edit assets/js/content.js, then run this again.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = (process.env.SITE_URL || 'https://mephie256.github.io/era92elevate-system-docs/').replace(/\/?$/, '/');
const SITE_PATH = new URL(SITE_URL).pathname;
const SITE_NAME = 'Elevate Help';
const TODAY = new Date().toISOString().slice(0, 10);
const OG_IMAGE = 'assets/img/og-image.png';

// Load the guide content and the renderer exactly as the browser does.
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/js/content.js'), 'utf8'), sandbox);
const DOCS = sandbox.window.ELEVATE_DOCS;
const { create } = (() => {
  const mod = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/render.js'), 'utf8'), { module: mod });
  return mod.exports;
})();

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const abs = (p) => SITE_URL + (p ? p.replace(/\/?$/, '/') : '');
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

const ORG = {
  '@type': 'Organization',
  name: 'era92 Elevate',
  url: SITE_URL,
  logo: SITE_URL + 'favicon.png',
  email: DOCS.support.email,
  telephone: DOCS.support.phones[0].tel,
};

function structuredData(page) {
  const graph = [];
  if (page.path === '') {
    graph.push({ '@type': 'WebSite', '@id': SITE_URL + '#website', name: SITE_NAME, url: SITE_URL, description: page.description, inLanguage: 'en', publisher: ORG });
  }
  if (page.crumbs) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: page.crumbs.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(p) })),
    });
  }
  if (page.type === 'article') {
    graph.push({
      '@type': 'TechArticle',
      headline: page.headline,
      description: page.description,
      url: abs(page.path),
      image: SITE_URL + (page.image || OG_IMAGE),
      articleSection: page.section,
      inLanguage: 'en',
      dateModified: TODAY,
      author: ORG,
      publisher: ORG,
      isPartOf: { '@id': SITE_URL + '#website' },
    });
    if (page.faq) {
      graph.push({
        '@type': 'FAQPage',
        mainEntity: page.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      });
    }
  }
  return graph.length ? `<script type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': graph })}</script>` : '';
}

function document(page, base, R) {
  const url = page.noindex ? SITE_URL : abs(page.path);
  const image = SITE_URL + OG_IMAGE;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(page.title)}</title>
  <meta name="description" content="${esc(page.description)}" />
  <meta name="robots" content="${page.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />
  ${page.noindex ? '' : `<link rel="canonical" href="${url}" />`}
  <meta name="theme-color" content="#faf6ed" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#131418" media="(prefers-color-scheme: dark)" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:type" content="${page.type === 'article' ? 'article' : 'website'}" />
  <meta property="og:title" content="${esc(page.title)}" />
  <meta property="og:description" content="${esc(page.description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Elevate Help: guides for every role on the era92 Elevate portal" />
  <meta property="og:locale" content="en_GB" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(page.title)}" />
  <meta name="twitter:description" content="${esc(page.description)}" />
  <meta name="twitter:image" content="${image}" />
  <link rel="icon" type="image/png" href="${base}favicon.png" />
  <link rel="apple-touch-icon" href="${base}favicon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Unbounded:wght@500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${base}assets/css/styles.css" />
  <script>
    // Apply the saved theme before paint so the page never flashes.
    (function () {
      try {
        var t = localStorage.getItem('elevate-docs-theme');
        if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
      } catch (e) {}
    })();
  </script>
  ${structuredData(page)}
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>

  <header class="topbar">
    <div class="topbar__inner">
      <button class="icon-btn menu-btn" id="menuBtn" type="button" aria-label="Open menu" aria-expanded="false">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>

      <a class="brand" href="${base}index.html" aria-label="Elevate Help home">
        <img class="brand__logo brand__logo--light" src="${base}assets/img/elevate-logo.png" alt="era92 elevate" width="263" height="72" />
        <img class="brand__logo brand__logo--dark" src="${base}assets/img/elevate-logo-dark.png" alt="era92 elevate" width="2001" height="553" />
        <span class="brand__tag">Help</span>
      </a>

      <nav class="topnav" id="topnav" aria-label="Roles">${R.topnav(page.current)}</nav>

      <div class="topbar__actions">
        <button class="search-trigger" id="searchOpen" type="button" aria-label="Search the guides">
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <span class="search-trigger__label">Search guides</span>
          <kbd>/</kbd>
        </button>
        <button class="icon-btn" id="themeBtn" type="button" aria-label="Switch light or dark mode">
          <svg class="i-sun" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <svg class="i-moon" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
  </header>

  <div class="scrim" id="scrim" hidden></div>
  <main id="main" tabindex="-1">${page.html}</main>

  <footer class="footer">
    <div class="footer__inner">
      <span>era92 Group · Elevate Help</span>
      <nav class="footer__links" aria-label="Footer">
        <a href="${R.url('start/get-help')}">Contact support</a>
        <a href="${R.url('start/sign-in')}">Sign-in help</a>
      </nav>
    </div>
  </footer>

  <div class="modal" id="searchModal" role="dialog" aria-modal="true" aria-label="Search the guides" hidden>
    <div class="modal__panel search">
      <div class="search__field">
        <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <input id="searchInput" type="search" placeholder="Try “attendance”, “pay”, “grade”…" autocomplete="off" aria-label="Search the guides" aria-controls="searchResults" />
        <button class="search__esc" id="searchClose" type="button">Esc</button>
      </div>
      <ul class="search__results" id="searchResults" role="listbox" aria-label="Results"></ul>
    </div>
  </div>

  <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Screenshot" hidden>
    <button class="lightbox__close" id="lightboxClose" type="button" aria-label="Close">×</button>
    <figure>
      <img id="lightboxImg" alt="" />
      <figcaption id="lightboxCap"></figcaption>
    </figure>
  </div>

  <script>window.DOCS_BASE = ${JSON.stringify(base)};</script>
  <script src="${base}assets/js/content.js" defer></script>
  <script src="${base}assets/js/render.js" defer></script>
  <script src="${base}assets/js/app.js" defer></script>
</body>
</html>
`;
}

// Remove pages from an earlier build (any folder that holds only a generated index.html).
const roleIds = DOCS.roles.map((r) => r.id);
for (const id of roleIds) fs.rmSync(path.join(ROOT, id), { recursive: true, force: true });

const pages = create(DOCS, '').pages();
for (const p of pages) {
  const depth = p.path ? p.path.split('/').length : 0;
  const base = '../'.repeat(depth);
  const R = create(DOCS, base);
  const page = R.pages().find((x) => x.path === p.path);
  const out = path.join(ROOT, p.path, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, document(page, base, R));
}

// 404: served from any depth, so it links from the site root.
{
  const R = create(DOCS, SITE_PATH);
  fs.writeFileSync(path.join(ROOT, '404.html'), document(R.notFound(), SITE_PATH, R));
}

fs.writeFileSync(
  path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    pages.map((p) => `  <url><loc>${abs(p.path)}</loc><lastmod>${TODAY}</lastmod><priority>${p.path === '' ? '1.0' : p.path.includes('/') ? '0.7' : '0.8'}</priority></url>`).join('\n') +
    `\n</urlset>\n`,
);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`);
fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');

console.log(`Built ${pages.length} pages for ${SITE_URL}`);
