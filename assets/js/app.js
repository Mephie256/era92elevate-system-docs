/*
 * Elevate Help — browser behaviour.
 *
 * Every page is pre-built as static HTML by scripts/build.mjs, so this file
 * only adds what needs a browser: search, the screenshot viewer, the theme
 * switch, the phone menu and the "On this page" highlight.
 */
(function () {
  'use strict';

  var BASE = window.DOCS_BASE || '';
  var R = window.ElevateRender.create(window.ELEVATE_DOCS, BASE);
  var esc = R.esc;

  // Old links looked like /#/student/enrol; send them to the real page.
  var old = location.hash.match(/^#\/(.*)$/);
  if (old) { location.replace(R.url(old[1])); return; }

  function storage(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  /* ---------- Search ---------- */
  var INDEX = R.searchIndex();
  var POPULAR = R.popularPaths;
  var modal = document.getElementById('searchModal');
  var input = document.getElementById('searchInput');
  var results = document.getElementById('searchResults');
  var selected = 0;
  var lastFocus = null;

  function search(q) {
    q = q.trim().toLowerCase();
    if (!q) {
      return INDEX.filter(function (x) { return POPULAR.indexOf(x.path) > -1; })
        .map(function (x) { return { item: x, snip: x.summary }; });
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
      if (a) location.href = a.getAttribute('href');
    }
  });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeSearch(); });
  document.getElementById('searchOpen').addEventListener('click', openSearch);
  document.getElementById('searchClose').addEventListener('click', closeSearch);

  /* ---------- Screenshot viewer ---------- */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lightboxImg');
  var lbCap = document.getElementById('lightboxCap');
  function openShot(name, cap) {
    lastFocus = document.activeElement;
    lbImg.src = BASE + 'assets/screens/' + name + '.webp';
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

  /* ---------- Phone menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var scrim = document.getElementById('scrim');
  function closeNav() {
    document.body.classList.remove('nav-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    scrim.hidden = true;
  }
  menuBtn.addEventListener('click', function () {
    if (!document.getElementById('sidebar')) { location.href = R.url('start'); return; }
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

  /* ---------- "On this page" highlight ---------- */
  var links = document.querySelectorAll('.toc a[data-target]');
  if (links.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) { l.classList.toggle('active', l.getAttribute('data-target') === e.target.id); });
      });
    }, { rootMargin: '-80px 0px -70% 0px' });
    links.forEach(function (l) { var el = document.getElementById(l.getAttribute('data-target')); if (el) spy.observe(el); });
  }

  /* ---------- Global events ---------- */
  document.addEventListener('click', function (e) {
    var s = e.target.closest('[data-shot]');
    if (s) { openShot(s.getAttribute('data-shot'), s.getAttribute('data-cap')); return; }
    if (e.target.closest('[data-open-search]')) { openSearch(); return; }
    var t = e.target.closest('.toc a[data-target]');
    if (t) {
      e.preventDefault();
      var el = document.getElementById(t.getAttribute('data-target'));
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', '#' + el.id); }
      return;
    }
    if (e.target.closest('a[href="#roles"]')) {
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
})();
