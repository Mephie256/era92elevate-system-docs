/* Elevate Help — routing, rendering, search, theme. No dependencies. */
(function () {
  'use strict';

  var DOCS = window.ELEVATE_DOCS;
  var ROLES = DOCS.roles;
  var main = document.getElementById('main');
  var SHOTS = 'assets/screens/';

  /* ---------- Helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // **bold**, `UI label`, [text](#/link)
  function inline(s) {
    return esc(s)
      .replace(/\[([^\]]+)\]\((#[^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<span class="ui">$1</span>');
  }
  function plain(s) {
    return String(s).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*`]/g, '');
  }
  function slug(s) {
    return plain(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function role(id) {
    return ROLES.filter(function (r) { return r.id === id; })[0];
  }
  function articlesOf(r) {
    var out = [];
    r.groups.forEach(function (g) {
      g.articles.forEach(function (a) { out.push({ role: r, group: g, article: a }); });
    });
    return out;
  }
  function count(r) { return articlesOf(r).length; }
  function storage(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  var ICONS = {
    tip: '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="15" height="15"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    warn: '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M12 4 2.5 20h19L12 4Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v4M12 17v.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  };
  // The wavy line from the Elevate style guide.
  var WAVE = '<svg viewBox="0 0 240 22" preserveAspectRatio="none" aria-hidden="true"><path d="M2 14c13 0 13-10 26-10s13 14 26 14 13-14 26-14 13 14 26 14 13-14 26-14 13 14 26 14 13-14 26-14 13 14 26 14 13-10 26-10" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>';

  var TASK_ICONS = {
    book: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z M4 21a2 2 0 0 1 2-2h13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    card: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="6" width="18" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M7 15h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    qr: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="m5 12 4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    edit: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 20h4L19 9l-4-4L4 16v4Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    user: '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21a8 8 0 0 1 16 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    key: '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="8" cy="15" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="m11 12 9-9M17 6l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6L12 16.8 6.6 19.6l1.1-6L3.2 9.4l6.1-.8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  };

  var POPULAR = [
    ['student', 'enrol', 'book', '', 'Apply for a course'],
    ['student', 'payments', 'card', '', 'Pay your fees with mobile money'],
    ['student', 'attendance', 'qr', '', 'Check in to class'],
    ['instructor', 'grading', 'check', 'teal', 'Mark submissions'],
    ['instructor', 'curriculum', 'edit', 'teal', 'Build modules and lessons'],
    ['hub-manager', 'approve', 'user', 'ink', 'Approve enrolment requests'],
    ['hub-manager', 'attendance', 'qr', 'ink', 'Take attendance with a QR code'],
    ['hub-manager', 'timetable', 'calendar', 'ink', 'Plan the timetable'],
    ['start', 'forgot-password', 'key', '', 'Reset a forgotten password'],
  ];

  /* ---------- Top nav ---------- */
  function renderTopnav(current) {
    var nav = document.getElementById('topnav');
    nav.innerHTML = ROLES.map(function (r) {
      return '<a href="#/' + r.id + '"' + (r.id === current ? ' aria-current="true"' : '') + '>' + esc(r.name) + '</a>';
    }).join('');
  }

  /* ---------- Home ---------- */
  function renderHome() {
    var student = role('student'), instructor = role('instructor'), hub = role('hub-manager');
    var support = DOCS.support;
    document.title = 'Elevate Help';

    var tasks = POPULAR.map(function (t) {
      var r = role(t[0]);
      return (
        '<a class="task" href="#/' + t[0] + '/' + t[1] + '">' +
          '<span class="task__icon' + (t[3] ? ' task__icon--' + t[3] : '') + '">' + TASK_ICONS[t[2]] + '</span>' +
          '<span><span class="task__title">' + esc(t[4]) + '</span><span class="task__meta">' + esc(r.name) + ' guide</span></span>' +
        '</a>'
      );
    }).join('');

    main.innerHTML =
      '<div class="home"><div class="shell">' +
        '<section class="hero">' +
          '<div>' +
            '<span class="eyebrow">Elevate Help Centre</span>' +
            '<h1>Learn the platform,<br>one role at a <span class="hl">time.' + WAVE + '</span></h1>' +
            '<p class="lead">Step-by-step guides for students, instructors and hub managers, written from how Elevate actually works, with real screens.</p>' +
            '<div class="hero__cta">' +
              '<a class="btn btn--primary" href="#roles">Find your guide</a>' +
              '<button class="btn btn--ghost" data-open-search>Search the guides</button>' +
            '</div>' +
          '</div>' +
          '<div class="hero__visual">' +
            '<div class="hero__photo"><img src="assets/img/auth-hero.png" alt="Students working together at an era92 Elevate hub" /></div>' +
            '<div class="float-chip"><span class="dot">' + TASK_ICONS.check.replace('width="20" height="20"', 'width="15" height="15"') + '</span>You’re checked in!</div>' +
          '</div>' +
        '</section>' +

        '<section class="roles" id="roles" aria-label="Guides by role">' +
          roleCard(student, 'student', '') +
          roleCard(instructor, 'instructor', '') +
          roleCard(hub, 'hub', '') +
        '</section>' +

        '<section class="section">' +
          '<div class="section__head"><div><h2>Popular tasks</h2><p>The things people look up most.</p></div>' +
          '<a href="#/start">Start here ' + ICONS.arrow + '</a></div>' +
          '<div class="tasks">' + tasks + '</div>' +
        '</section>' +

        '<section class="support">' +
          '<svg class="support__wave" viewBox="0 0 240 22" aria-hidden="true">' + WAVE.replace(/<\/?svg[^>]*>/g, '').replace('currentColor', '#fff') + '</svg>' +
          '<div><h2>Still stuck?</h2><p>The era92 Elevate team is happy to help. Email or call us and tell us your role and what you were trying to do.</p></div>' +
          '<div class="contact-list">' + contactLinks(support) + '</div>' +
        '</section>' +
      '</div></div>';
  }

  function roleCard(r, kind, extra) {
    return (
      '<a class="role-card role-card--' + kind + '" href="#/' + r.id + '">' +
        '<div>' +
          '<div class="role-card__num">' + count(r) + '</div>' +
          '<div class="role-card__name">' + esc(r.name) + ' guides</div>' +
          '<div class="role-card__blurb">' + esc(r.blurb) + '</div>' +
        '</div>' +
        '<div class="role-card__foot">' + (extra || '<span>Open guides</span>') +
          '<span class="role-card__arrow">' + ICONS.arrow + '</span></div>' +
      '</a>'
    );
  }


  function contactLinks(support) {
    return (
      '<a href="mailto:' + esc(support.email) + '">' + ICONS.mail + esc(support.email) + '</a>' +
      support.phones.map(function (p) {
        return '<a href="tel:' + esc(p.tel) + '">' + ICONS.phone + esc(p.display) + '</a>';
      }).join('')
    );
  }

  /* ---------- Docs layout ---------- */
  function sidebar(r, activeId) {
    var sw = ROLES.map(function (x) {
      return '<a href="#/' + x.id + '"' + (x.id === r.id ? ' aria-current="true"' : '') + '>' + esc(x.name) + '</a>';
    }).join('');
    var groups = r.groups.map(function (g) {
      return (
        '<div class="nav-group"><div class="nav-group__title">' + esc(g.name) + '</div>' +
        g.articles.map(function (a) {
          return '<a href="#/' + r.id + '/' + a.id + '"' + (a.id === activeId ? ' aria-current="page"' : '') + '>' + esc(a.title) + '</a>';
        }).join('') +
        '</div>'
      );
    }).join('');
    return '<aside class="sidebar" id="sidebar" aria-label="' + esc(r.name) + ' guides"><nav class="role-switch" aria-label="Choose a role">' + sw + '</nav>' + groups + '</aside>';
  }

  function renderRole(r) {
    document.title = r.name + ' guides · Elevate Help';
    var groups = r.groups.map(function (g) {
      return (
        '<section class="guide-group"><h2>' + esc(g.name) + '</h2><div class="guide-grid">' +
        g.articles.map(function (a) {
          return (
            '<a class="task" href="#/' + r.id + '/' + a.id + '">' +
              '<span class="task__icon' + (r.id === 'instructor' ? ' task__icon--teal' : r.id === 'hub-manager' || r.id === 'start' ? ' task__icon--ink' : '') + '">' + ICONS.arrow + '</span>' +
              '<span><span class="task__title">' + esc(a.title) + '</span><span class="task__meta">' + esc(a.summary) + '</span></span>' +
            '</a>'
          );
        }).join('') +
        '</div></section>'
      );
    }).join('');

    main.innerHTML =
      '<div class="docs">' + sidebar(r, null) +
        '<div class="content">' +
          '<div class="crumbs"><a href="#/">Help</a><span>/</span><span>' + esc(r.name) + '</span></div>' +
          '<div class="role-hero role-hero--' + r.id + '">' +
            '<h1>' + (r.id === 'start' ? 'Start here' : esc(r.name) + ' guides') + '</h1>' +
            '<p>' + esc(r.blurb) + '</p>' +
            '<svg viewBox="0 0 240 22">' + WAVE.replace(/<\/?svg[^>]*>/g, '').replace('currentColor', '#fff') + '</svg>' +
          '</div>' +
          groups +
        '</div>' +
      '</div>';
  }

  // The page name shown on the screenshot's browser tab.
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
  };
  function tabTitle(name) {
    if (TAB_TITLES[name]) return TAB_TITLES[name];
    var t = name.replace(/^(public|student|instructor|hubmanager)-/, '').replace(/-/g, ' ');
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function renderBlock(b, headings) {
    switch (b[0]) {
      case 'p': return '<p>' + inline(b[1]) + '</p>';
      case 'h':
        var id = slug(b[1]);
        headings.push({ id: id, text: b[1] });
        return '<h2 id="' + id + '">' + inline(b[1]) + '</h2>';
      case 'ul': return '<ul>' + b[1].map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ul>';
      case 'steps': return '<ol class="steps">' + b[1].map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</ol>';
      case 'note':
        return '<div class="note note--' + b[1] + '" role="note"><span class="note__icon">' + ICONS[b[1]] + '</span>' +
          '<div><div class="note__title">' + inline(b[2]) + '</div><p>' + inline(b[3]) + '</p></div></div>';
      case 'shot':
        return '<figure class="shot"><button class="shot__frame" data-shot="' + esc(b[1]) + '" data-cap="' + esc(b[2]) + '" aria-label="Enlarge screenshot: ' + esc(b[2]) + '">' +
          '<span class="shot__bar" aria-hidden="true"><span class="shot__dots"><i></i><i></i><i></i></span>' +
          '<span class="shot__tab"><img src="favicon.png" alt="" width="14" height="14" />' + esc(tabTitle(b[1])) + ' · Elevate</span></span>' +
          '<img src="' + SHOTS + esc(b[1]) + '.webp" alt="' + esc(b[2]) + '" loading="lazy" width="1440" height="900" /></button>' +
          '<figcaption>' + inline(b[2]) + '</figcaption></figure>';
      case 'table':
        return '<div class="table-wrap"><table><thead><tr>' + b[1].map(function (h) { return '<th>' + inline(h) + '</th>'; }).join('') +
          '</tr></thead><tbody>' + b[2].map(function (row) {
            return '<tr>' + row.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>';
          }).join('') + '</tbody></table></div>';
      case 'contact':
        return '<div class="support" style="margin-top:22px"><div><h2>era92 Elevate team</h2><p>Tell us your role and what you were trying to do.</p></div><div class="contact-list">' + contactLinks(DOCS.support) + '</div></div>';
      default: return '';
    }
  }

  function renderArticle(r, a) {
    document.title = a.title + ' · ' + r.name + ' · Elevate Help';
    var headings = [];
    var body = a.blocks.map(function (b) { return renderBlock(b, headings); }).join('');

    var list = articlesOf(r);
    var idx = list.map(function (x) { return x.article.id; }).indexOf(a.id);
    var prev = list[idx - 1], next = list[idx + 1];
    var group = list[idx].group;

    var toc = headings.length
      ? '<div class="toc__title">On this page</div>' + headings.map(function (h) {
          return '<a href="#" data-target="' + h.id + '">' + esc(plain(h.text)) + '</a>';
        }).join('')
      : '';

    main.innerHTML =
      '<div class="docs">' + sidebar(r, a.id) +
        '<article class="content article">' +
          '<div class="crumbs"><a href="#/">Help</a><span>/</span><a href="#/' + r.id + '">' + esc(r.name) + '</a><span>/</span><span>' + esc(group.name) + '</span></div>' +
          '<span class="role-pill role-pill--' + r.id + '">' + esc(r.id === 'start' ? 'Everyone' : r.name) + '</span>' +
          '<h1 style="margin-top:14px">' + esc(a.title) + '</h1>' +
          '<p class="summary">' + inline(a.summary) + '</p>' +
          '<div class="article__body">' + body + '</div>' +
          '<nav class="pager" aria-label="More guides">' +
            (prev ? '<a class="prev" href="#/' + r.id + '/' + prev.article.id + '"><small>← Previous</small><span>' + esc(prev.article.title) + '</span></a>' : '') +
            (next ? '<a class="next" href="#/' + r.id + '/' + next.article.id + '"><small>Next →</small><span>' + esc(next.article.title) + '</span></a>' : '') +
          '</nav>' +
        '</article>' +
        '<aside class="toc" aria-label="On this page">' + toc +
          '<div class="toc__help"><strong>Need a person?</strong><br>Email <a href="mailto:' + esc(DOCS.support.email) + '">' + esc(DOCS.support.email) + '</a> or see <a href="#/start/get-help">all contacts</a>.</div>' +
        '</aside>' +
      '</div>';

    setupScrollSpy(headings);
  }

  function renderNotFound() {
    document.title = 'Not found · Elevate Help';
    main.innerHTML = '<div class="home"><div class="shell" style="text-align:center"><h1 style="font-family:var(--font-display);font-weight:600">We couldn’t find that guide</h1><p style="color:var(--text-2)">It may have moved. Try searching instead.</p><div class="hero__cta" style="justify-content:center"><a class="btn btn--primary" href="#/">Back to Help</a><button class="btn btn--ghost" data-open-search>Search</button></div></div></div>';
  }

  /* ---------- Router ---------- */
  function route() {
    var hash = location.hash.replace(/^#\/?/, '');
    if (hash === 'roles') return; // in-page anchor on home
    var parts = hash.split('/').filter(Boolean);
    closeNav();
    if (!parts.length) {
      renderTopnav(null);
      renderHome();
    } else {
      var r = role(parts[0]);
      if (!r) { renderTopnav(null); renderNotFound(); }
      else if (!parts[1]) { renderTopnav(r.id); renderRole(r); }
      else {
        var a = articlesOf(r).filter(function (x) { return x.article.id === parts[1]; })[0];
        renderTopnav(r.id);
        if (a) renderArticle(r, a.article); else renderNotFound();
      }
    }
    window.scrollTo(0, 0);
  }

  /* ---------- Scroll spy for "On this page" ---------- */
  var spy;
  function setupScrollSpy(headings) {
    if (spy) spy.disconnect();
    if (!headings.length || !('IntersectionObserver' in window)) return;
    var links = document.querySelectorAll('.toc a[data-target]');
    spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) { l.classList.toggle('active', l.getAttribute('data-target') === e.target.id); });
      });
    }, { rootMargin: '-80px 0px -70% 0px' });
    headings.forEach(function (h) { var el = document.getElementById(h.id); if (el) spy.observe(el); });
  }

  /* ---------- Search ---------- */
  var INDEX = [];
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
      INDEX.push({
        href: '#/' + r.id + '/' + x.article.id,
        role: r.id === 'start' ? 'Everyone' : r.name,
        title: x.article.title,
        summary: plain(x.article.summary),
        text: plain(text),
      });
    });
  });

  var modal = document.getElementById('searchModal');
  var input = document.getElementById('searchInput');
  var results = document.getElementById('searchResults');
  var selected = 0;
  var lastFocus = null;

  function search(q) {
    q = q.trim().toLowerCase();
    if (!q) {
      return INDEX.filter(function (x) {
        return POPULAR.some(function (p) { return x.href === '#/' + p[0] + '/' + p[1]; });
      }).map(function (x) { return { item: x, snip: x.summary }; });
    }
    var words = q.split(/\s+/);
    return INDEX.map(function (x) {
      var title = x.title.toLowerCase(), sum = x.summary.toLowerCase(), body = x.text.toLowerCase(), role = x.role.toLowerCase();
      var score = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i], s = 0;
        if (title.indexOf(w) > -1) s += 10;
        if (sum.indexOf(w) > -1) s += 5;
        if (role.indexOf(w) > -1) s += 3;
        if (body.indexOf(w) > -1) s += 2;
        if (!s) return null; // every word must match somewhere
        score += s;
      }
      var pos = body.indexOf(words[0]);
      var snip = pos > -1 ? (pos > 40 ? '…' : '') + x.text.substr(Math.max(0, pos - 40), 150) + '…' : x.summary;
      return { item: x, score: score, snip: snip };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 12);
  }

  function highlight(s, q) {
    var out = esc(s);
    q.trim().split(/\s+/).filter(function (w) { return w.length > 1; }).forEach(function (w) {
      out = out.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
    });
    return out;
  }

  function drawResults() {
    var q = input.value;
    var list = search(q);
    selected = 0;
    if (!list.length) {
      results.innerHTML = '<li class="search__empty">No guides match “' + esc(q) + '”. Try a simpler word, like “pay” or “code”.</li>';
      return;
    }
    results.innerHTML = list.map(function (r, i) {
      return '<li role="option" aria-selected="' + (i === 0) + '"><a href="' + r.item.href + '">' +
        '<div class="sr__top"><span class="sr__title">' + highlight(r.item.title, q) + '</span><span class="sr__role">' + esc(r.item.role) + '</span></div>' +
        '<div class="sr__snip">' + highlight(r.snip, q) + '</div></a></li>';
    }).join('');
  }

  function moveSel(d) {
    var items = results.querySelectorAll('li[role="option"]');
    if (!items.length) return;
    items[selected].setAttribute('aria-selected', 'false');
    selected = (selected + d + items.length) % items.length;
    items[selected].setAttribute('aria-selected', 'true');
    items[selected].scrollIntoView({ block: 'nearest' });
  }

  function openSearch() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    input.value = '';
    drawResults();
    input.focus();
  }
  function closeSearch() {
    modal.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  input.addEventListener('input', drawResults);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); }
    else if (e.key === 'Enter') {
      var a = results.querySelector('li[aria-selected="true"] a');
      if (a) { location.hash = a.getAttribute('href'); closeSearch(); }
    }
  });
  results.addEventListener('click', function (e) { if (e.target.closest('a')) closeSearch(); });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeSearch(); });
  document.getElementById('searchOpen').addEventListener('click', openSearch);
  document.getElementById('searchClose').addEventListener('click', closeSearch);

  /* ---------- Lightbox ---------- */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lightboxImg');
  var lbCap = document.getElementById('lightboxCap');
  function openShot(name, cap) {
    lastFocus = document.activeElement;
    lbImg.src = SHOTS + name + '.webp';
    lbImg.alt = cap;
    lbCap.textContent = cap;
    lb.hidden = false;
    document.getElementById('lightboxClose').focus();
  }
  function closeShot() {
    lb.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.id === 'lightboxClose') closeShot(); });

  /* ---------- Mobile nav ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var scrim = document.getElementById('scrim');
  function closeNav() {
    document.body.classList.remove('nav-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    scrim.hidden = true;
  }
  menuBtn.addEventListener('click', function () {
    if (!document.getElementById('sidebar')) { location.hash = '#/start'; return; }
    var open = !document.body.classList.contains('nav-open');
    document.body.classList.toggle('nav-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    scrim.hidden = !open;
  });
  scrim.addEventListener('click', closeNav);

  /* ---------- Theme ---------- */
  function currentTheme() {
    var set = document.documentElement.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.getElementById('themeBtn').addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    storage('elevate-docs-theme', next);
  });

  /* ---------- Global events ---------- */
  document.addEventListener('click', function (e) {
    var s = e.target.closest('[data-shot]');
    if (s) { openShot(s.getAttribute('data-shot'), s.getAttribute('data-cap')); return; }
    if (e.target.closest('[data-open-search]')) { openSearch(); return; }
    var t = e.target.closest('.toc a[data-target]');
    if (t) {
      e.preventDefault();
      var el = document.getElementById(t.getAttribute('data-target'));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    var anchor = e.target.closest('a[href="#roles"]');
    if (anchor) {
      e.preventDefault();
      document.getElementById('roles').scrollIntoView({ behavior: 'smooth' });
    }
  });
  document.addEventListener('keydown', function (e) {
    var typing = /input|textarea|select/i.test(document.activeElement.tagName);
    if (e.key === 'Escape') {
      if (!modal.hidden) closeSearch();
      else if (!lb.hidden) closeShot();
      else closeNav();
    } else if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      openSearch();
    }
  });

  window.addEventListener('hashchange', route);
  route();
})();
