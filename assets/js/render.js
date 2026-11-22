/*
 * Elevate Help — page rendering.
 *
 * Pure string building, no DOM. The build script (scripts/build.mjs) runs it
 * in Node to write one static HTML page per guide, so every page is readable
 * by search engines without JavaScript. The browser loads it too, for search.
 */
(function (root) {
  'use strict';

  function create(DOCS, base) {
    var ROLES = DOCS.roles;
    base = base || '';

    /* ---------- Helpers ---------- */
    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    // A link to another page of the site: 'student/enrol' -> '../../student/enrol/index.html'.
    // Links name the file so the site also works when opened straight from disk;
    // the canonical URLs in each page's <head> stay clean (no index.html).
    function url(path) {
      path = String(path || '').replace(/^#?\/?/, '').replace(/\/$/, '');
      return base + (path ? path + '/' : '') + 'index.html';
    }
    function asset(p) { return base + p; }
    // **bold**, `UI label`, [text](#/link)
    function inline(s) {
      return esc(s)
        .replace(/\[([^\]]+)\]\(#\/([^)]+)\)/g, function (_, t, p) { return '<a href="' + url(p) + '">' + t + '</a>'; })
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<span class="ui">$1</span>');
    }
    function plain(s) { return String(s).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*`]/g, ''); }
    function slug(s) { return plain(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    function role(id) { return ROLES.filter(function (r) { return r.id === id; })[0]; }
    function articlesOf(r) {
      var out = [];
      r.groups.forEach(function (g) { g.articles.forEach(function (a) { out.push({ role: r, group: g, article: a }); }); });
      return out;
    }
    function count(r) { return articlesOf(r).length; }
    function roleLabel(r) { return r.id === 'start' ? 'Everyone' : r.name; }

    var ICONS = {
      tip: '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      info: '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
      warn: '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M12 4 2.5 20h19L12 4Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v4M12 17v.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
      arrow: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      mail: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
      phone: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    };
    // The wavy line from the Elevate style guide.
    var WAVE = '<svg viewBox="0 0 240 22" preserveAspectRatio="none" aria-hidden="true"><path d="M2 14c13 0 13-10 26-10s13 14 26 14 13-14 26-14 13 14 26 14 13-14 26-14 13 14 26 14 13-14 26-14 13 14 26 14 13-10 26-10" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>';
    var WAVE_PATH = WAVE.replace(/<\/?svg[^>]*>/g, '').replace('currentColor', '#fff');

    var TASK_ICONS = {
      book: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z M4 21a2 2 0 0 1 2-2h13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
      card: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M7 15h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      qr: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
      check: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      edit: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
      calendar: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      user: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21a8 8 0 0 1 16 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      key: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="8" cy="15" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="m11 12 9-9M17 6l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      shield: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    };

    var POPULAR = [
      ['student', 'enrol', 'book', '', 'Apply for a course'],
      ['student', 'payments', 'card', '', 'Pay your fees with mobile money'],
      ['student', 'attendance', 'qr', '', 'Check in to class'],
      ['instructor', 'grading', 'check', 'teal', 'Mark submissions'],
      ['instructor', 'curriculum', 'edit', 'teal', 'Build modules and lessons'],
      ['hub-manager', 'approve', 'user', 'ink', 'Approve enrolment requests'],
      ['hub-manager', 'attendance', 'qr', 'ink', 'Take attendance with a QR code'],
      ['admin', 'users', 'shield', 'ink', 'Create users and set roles'],
      ['start', 'forgot-password', 'key', '', 'Reset a forgotten password'],
    ];

    // The page name shown on a screenshot's browser tab.
    var TAB_TITLES = {
      'public-login': 'Sign in', 'public-register': 'Sign up', 'student-home': 'Home',
      'student-catalog': 'Course Catalog', 'student-course-player': 'Website Development',
      'student-live-classes': 'My Classes', 'student-attend-code': 'Mark Attendance',
      'student-chats': 'Chats & Inquiries', 'instructor-chats': 'Chats & Inquiries', 'hubmanager-chats': 'Chats & Inquiries',
      'instructor-courses': 'My Classes', 'instructor-submissions': 'All Submissions',
      'instructor-reports': 'Reports & Analytics', 'hubmanager-courses': 'Course Management',
      'hubmanager-announcements': 'Announcements & Events', 'hubmanager-performance': 'Hub Performance',
      'hubmanager-blueprints': 'Student Blueprints', 'hubmanager-reports': 'Hub Reports',
      'hubmanager-online-progress': 'Online Course Progress', 'instructor-online-progress': 'Online Course Progress',
      'admin-dashboard': 'Dashboard', 'admin-courses': 'Course Management', 'admin-users': 'Users & Roles',
      'admin-registrations': 'Users & Roles', 'admin-hubs': 'Hub Management', 'admin-reports': 'Reports & Analytics',
      'admin-performance': 'Student Performance', 'admin-blueprints': 'Student Blueprints',
      'admin-announcements': 'Announcements & Events', 'admin-online-progress': 'Online Course Progress',
      'admin-job-placements': 'Job Placements',
    };
    function tabTitle(name) {
      if (TAB_TITLES[name]) return TAB_TITLES[name];
      var t = name.replace(/^(public|student|instructor|hubmanager|admin)-/, '').replace(/-/g, ' ');
      return t.charAt(0).toUpperCase() + t.slice(1);
    }

    /* ---------- Top nav ---------- */
    function topnav(current) {
      return ROLES.map(function (r) {
        return '<a href="' + url(r.id) + '"' + (r.id === current ? ' aria-current="true"' : '') + '>' + esc(r.name) + '</a>';
      }).join('');
    }

    /* ---------- Home ---------- */
    function contactLinks() {
      var s = DOCS.support;
      return '<a href="mailto:' + esc(s.email) + '">' + ICONS.mail + esc(s.email) + '</a>' +
        s.phones.map(function (p) { return '<a href="tel:' + esc(p.tel) + '">' + ICONS.phone + esc(p.display) + '</a>'; }).join('');
    }

    function roleCard(r, kind) {
      return '<a class="role-card role-card--' + kind + '" href="' + url(r.id) + '">' +
        '<div><div class="role-card__num">' + count(r) + '</div>' +
        '<div class="role-card__name">' + esc(r.name) + ' guides</div>' +
        '<div class="role-card__blurb">' + esc(r.blurb) + '</div></div>' +
        '<div class="role-card__foot"><span>Open guides</span><span class="role-card__arrow">' + ICONS.arrow + '</span></div></a>';
    }

    function home() {
      var tasks = POPULAR.filter(function (t) { return role(t[0]); }).map(function (t) {
        return '<a class="task" href="' + url(t[0] + '/' + t[1]) + '">' +
          '<span class="task__icon' + (t[3] ? ' task__icon--' + t[3] : '') + '">' + TASK_ICONS[t[2]] + '</span>' +
          '<span><span class="task__title">' + esc(t[4]) + '</span><span class="task__meta">' + esc(roleLabel(role(t[0]))) + ' guide</span></span></a>';
      }).join('');
      var cards = [['student', 'student'], ['instructor', 'instructor'], ['hub-manager', 'hub'], ['admin', 'admin']]
        .filter(function (c) { return role(c[0]); })
        .map(function (c) { return roleCard(role(c[0]), c[1]); }).join('');

      var html =
        '<div class="home"><div class="shell">' +
          '<section class="hero">' +
            '<div>' +
              '<p class="eyebrow">Elevate Help Centre</p>' +
              '<h1>Learn the platform,<br>one role at a <span class="hl">time.' + WAVE + '</span></h1>' +
              '<p class="lead">Step-by-step guides for students, instructors, hub managers and admins, written from how Elevate actually works, with real screens.</p>' +
              '<div class="hero__cta">' +
                '<a class="btn btn--primary" href="#roles">Find your guide</a>' +
                '<button class="btn btn--ghost" type="button" data-open-search>Search the guides</button>' +
              '</div>' +
            '</div>' +
            '<div class="hero__visual">' +
              '<div class="hero__photo"><img src="' + asset('assets/img/auth-hero.png') + '" alt="Students working together on a laptop at an era92 Elevate learning hub" width="696" height="565" fetchpriority="high" /></div>' +
              '<div class="float-chip" aria-hidden="true"><span class="dot">' + TASK_ICONS.check.replace('width="20" height="20"', 'width="15" height="15"') + '</span>You’re checked in!</div>' +
            '</div>' +
          '</section>' +
          '<section class="roles" id="roles" aria-label="Guides by role">' + cards + '</section>' +
          '<section class="section">' +
            '<div class="section__head"><div><h2>Popular tasks</h2><p>The things people look up most.</p></div>' +
            '<a href="' + url('start') + '">Start here ' + ICONS.arrow + '</a></div>' +
            '<div class="tasks">' + tasks + '</div>' +
          '</section>' +
          '<section class="support">' +
            '<svg class="support__wave" viewBox="0 0 240 22" aria-hidden="true">' + WAVE_PATH + '</svg>' +
            '<div><h2>Still stuck?</h2><p>The era92 Elevate team is happy to help. Email or call us and tell us your role and what you were trying to do.</p></div>' +
            '<div class="contact-list">' + contactLinks() + '</div>' +
          '</section>' +
        '</div></div>';

      return {
        path: '',
        title: 'Elevate Help: guides for every role on the era92 Elevate portal',
        description: 'Step-by-step help for students, instructors, hub managers and admins on the era92 Elevate learning portal: enrol, pay, learn, mark work, take attendance and manage users.',
        current: null,
        html: html,
        type: 'website',
      };
    }

    /* ---------- Guides ---------- */
    function sidebar(r, activeId) {
      var sw = ROLES.map(function (x) {
        return '<a href="' + url(x.id) + '"' + (x.id === r.id ? ' aria-current="true"' : '') + '>' + esc(x.name) + '</a>';
      }).join('');
      var groups = r.groups.map(function (g) {
        return '<div class="nav-group"><div class="nav-group__title">' + esc(g.name) + '</div>' +
          g.articles.map(function (a) {
            return '<a href="' + url(r.id + '/' + a.id) + '"' + (a.id === activeId ? ' aria-current="page"' : '') + '>' + esc(a.title) + '</a>';
          }).join('') + '</div>';
      }).join('');
      return '<aside class="sidebar" id="sidebar" aria-label="' + esc(r.name) + ' guides"><nav class="role-switch" aria-label="Choose a role">' + sw + '</nav><nav aria-label="' + esc(r.name) + ' guides">' + groups + '</nav></aside>';
    }

    function rolePage(r) {
      var iconClass = r.id === 'instructor' ? ' task__icon--teal' : (r.id === 'hub-manager' || r.id === 'start' || r.id === 'admin') ? ' task__icon--ink' : '';
      var groups = r.groups.map(function (g) {
        return '<section class="guide-group"><h2>' + esc(g.name) + '</h2><div class="guide-grid">' +
          g.articles.map(function (a) {
            return '<a class="task" href="' + url(r.id + '/' + a.id) + '"><span class="task__icon' + iconClass + '">' + ICONS.arrow + '</span>' +
              '<span><span class="task__title">' + esc(a.title) + '</span><span class="task__meta">' + esc(plain(a.summary)) + '</span></span></a>';
          }).join('') + '</div></section>';
      }).join('');
      var heading = r.id === 'start' ? 'Start here' : r.name + ' guides';
      var html = '<div class="docs">' + sidebar(r, null) +
        '<div class="content">' +
          '<nav class="crumbs" aria-label="Breadcrumb"><a href="' + url('') + '">Help</a><span aria-hidden="true">/</span><span>' + esc(r.name) + '</span></nav>' +
          '<div class="role-hero role-hero--' + r.id + '"><h1>' + esc(heading) + '</h1><p>' + esc(r.blurb) + '</p><svg viewBox="0 0 240 22" aria-hidden="true">' + WAVE_PATH + '</svg></div>' +
          groups +
        '</div></div>';
      return {
        path: r.id,
        title: (r.id === 'start' ? 'Getting started with Elevate' : r.name + ' guides for Elevate') + ' · Elevate Help',
        description: r.blurb + ' ' + count(r) + ' step-by-step guides with screenshots.',
        current: r.id,
        html: html,
        type: 'website',
        crumbs: [['Help', ''], [r.name, r.id]],
      };
    }

    function renderBlock(b, ctx) {
      switch (b[0]) {
        case 'p': return '<p>' + inline(b[1]) + '</p>';
        case 'h':
          var id = slug(b[1]);
          ctx.headings.push({ id: id, text: b[1] });
          return '<h2 id="' + id + '">' + inline(b[1]) + '</h2>';
        case 'ul': return '<ul>' + b[1].map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ul>';
        case 'steps': return '<ol class="steps">' + b[1].map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ol>';
        case 'note':
          return '<div class="note note--' + b[1] + '" role="note"><span class="note__icon">' + ICONS[b[1]] + '</span>' +
            '<div><div class="note__title">' + inline(b[2]) + '</div><p>' + inline(b[3]) + '</p></div></div>';
        case 'shot':
          var first = !ctx.shots++;
          ctx.images.push(b[1]);
          return '<figure class="shot"><button class="shot__frame" type="button" data-shot="' + esc(b[1]) + '" data-cap="' + esc(plain(b[2])) + '" aria-label="Enlarge screenshot: ' + esc(plain(b[2])) + '">' +
            '<span class="shot__bar" aria-hidden="true"><span class="shot__dots"><i></i><i></i><i></i></span>' +
            '<span class="shot__tab"><img src="' + asset('favicon.png') + '" alt="" width="14" height="14" />' + esc(tabTitle(b[1])) + ' · Elevate</span></span>' +
            '<img src="' + asset('assets/screens/' + b[1] + '.webp') + '" alt="' + esc(plain(b[2])) + '" width="1440" height="900"' + (first ? ' fetchpriority="high"' : ' loading="lazy"') + ' /></button>' +
            '<figcaption>' + inline(b[2]) + '</figcaption></figure>';
        case 'table':
          return '<div class="table-wrap"><table><thead><tr>' + b[1].map(function (h) { return '<th scope="col">' + inline(h) + '</th>'; }).join('') +
            '</tr></thead><tbody>' + b[2].map(function (row) {
              return '<tr>' + row.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>';
            }).join('') + '</tbody></table></div>';
        case 'contact':
          return '<div class="support" style="margin-top:22px"><div><h2>era92 Elevate team</h2><p>Tell us your role and what you were trying to do.</p></div><div class="contact-list">' + contactLinks() + '</div></div>';
        default: return '';
      }
    }

    function articlePage(r, a) {
      var ctx = { headings: [], shots: 0, images: [] };
      var body = a.blocks.map(function (b) { return renderBlock(b, ctx); }).join('');
      var list = articlesOf(r);
      var idx = list.map(function (x) { return x.article.id; }).indexOf(a.id);
      var prev = list[idx - 1], next = list[idx + 1];
      var group = list[idx].group;
      var toc = ctx.headings.length
        ? '<div class="toc__title">On this page</div>' + ctx.headings.map(function (h) { return '<a href="#' + h.id + '" data-target="' + h.id + '">' + esc(plain(h.text)) + '</a>'; }).join('')
        : '';
      var html = '<div class="docs">' + sidebar(r, a.id) +
        '<article class="content article">' +
          '<nav class="crumbs" aria-label="Breadcrumb"><a href="' + url('') + '">Help</a><span aria-hidden="true">/</span><a href="' + url(r.id) + '">' + esc(r.name) + '</a><span aria-hidden="true">/</span><span>' + esc(group.name) + '</span></nav>' +
          '<span class="role-pill role-pill--' + r.id + '">' + esc(roleLabel(r)) + '</span>' +
          '<h1 style="margin-top:14px">' + esc(a.title) + '</h1>' +
          '<p class="summary">' + inline(a.summary) + '</p>' +
          '<div class="article__body">' + body + '</div>' +
          '<nav class="pager" aria-label="More guides">' +
            (prev ? '<a class="prev" href="' + url(r.id + '/' + prev.article.id) + '" rel="prev"><small>← Previous</small><span>' + esc(prev.article.title) + '</span></a>' : '') +
            (next ? '<a class="next" href="' + url(r.id + '/' + next.article.id) + '" rel="next"><small>Next →</small><span>' + esc(next.article.title) + '</span></a>' : '') +
          '</nav>' +
        '</article>' +
        '<aside class="toc" aria-label="On this page">' + toc +
          '<div class="toc__help"><strong>Need a person?</strong><br>Email <a href="mailto:' + esc(DOCS.support.email) + '">' + esc(DOCS.support.email) + '</a> or see <a href="' + url('start/get-help') + '">all contacts</a>.</div>' +
        '</aside></div>';

      // Questions and answers, for FAQ structured data.
      var faq = [];
      for (var i = 0; i < a.blocks.length - 1; i++) {
        if (a.blocks[i][0] === 'h' && a.blocks[i + 1][0] === 'p' && /\?$/.test(a.blocks[i][1])) faq.push([plain(a.blocks[i][1]), plain(a.blocks[i + 1][1])]);
      }
      var steps = a.blocks.filter(function (b) { return b[0] === 'steps'; })[0];

      var who = roleLabel(r) === 'Everyone' ? '' : ' for ' + r.name.toLowerCase() + 's';
      return {
        path: r.id + '/' + a.id,
        title: a.title + (who ? ' (' + r.name + ')' : '') + ' · Elevate Help',
        description: plain(a.summary).replace(/\.?$/, '.') + ' A step-by-step Elevate guide' + who + ', with screenshots.',
        current: r.id,
        html: html,
        type: 'article',
        headline: a.title,
        image: ctx.images[0] ? 'assets/screens/' + ctx.images[0] + '.webp' : null,
        crumbs: [['Help', ''], [r.name, r.id], [a.title, r.id + '/' + a.id]],
        faq: faq.length >= 2 ? faq : null,
        steps: steps ? steps[1].map(plain) : null,
        section: r.name,
      };
    }

    function notFound() {
      return {
        path: '404',
        title: 'Page not found · Elevate Help',
        description: 'We could not find that guide.',
        current: null,
        noindex: true,
        html: '<div class="home"><div class="shell" style="text-align:center"><h1 style="font-family:var(--font-display);font-weight:600">We couldn’t find that guide</h1><p style="color:var(--text-2)">It may have moved. Search for it, or start from the Help home page.</p><div class="hero__cta" style="justify-content:center;margin-top:20px"><a class="btn btn--primary" href="' + url('') + '">Back to Help</a><button class="btn btn--ghost" type="button" data-open-search>Search</button></div></div></div>',
      };
    }

    /* ---------- Every page of the site ---------- */
    function pages() {
      var out = [home()];
      ROLES.forEach(function (r) {
        out.push(rolePage(r));
        articlesOf(r).forEach(function (x) { out.push(articlePage(r, x.article)); });
      });
      return out;
    }

    /* ---------- Search index ---------- */
    function searchIndex() {
      var idx = [];
      ROLES.forEach(function (r) {
        articlesOf(r).forEach(function (x) {
          var text = x.article.blocks.map(function (b) {
            if (b[0] === 'p' || b[0] === 'h') return b[1];
            if (b[0] === 'ul' || b[0] === 'steps') return b[1].join(' ');
            if (b[0] === 'note') return b[2] + ' ' + b[3];
            if (b[0] === 'table') return b[2].map(function (row) { return row.join(' '); }).join(' ');
            if (b[0] === 'shot') return b[2];
            return '';
          }).join(' ');
          idx.push({ href: url(r.id + '/' + x.article.id), path: r.id + '/' + x.article.id, role: roleLabel(r), title: x.article.title, summary: plain(x.article.summary), text: plain(text) });
        });
      });
      return idx;
    }

    return {
      esc: esc, url: url, topnav: topnav, pages: pages, notFound: notFound, searchIndex: searchIndex,
      popularPaths: POPULAR.map(function (p) { return p[0] + '/' + p[1]; }),
    };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { create: create };
  else root.ElevateRender = { create: create };
})(this);
