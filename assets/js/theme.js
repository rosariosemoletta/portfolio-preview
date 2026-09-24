/* ═══════════════════════════════════════════════
   THEME.JS — light / dark
   Include it in the <head> (without defer) so the theme
   is applied before the first paint, with no flash.
   Priority: saved choice > the system setting (dark or light).

   The switch is a sun that morphs into a moon; the new theme
   spreads across the page from the button (View Transitions API,
   with an instant swap as fallback).
   ═══════════════════════════════════════════════ */

(function () {
  var KEY  = 'theme';
  var root = document.documentElement;
  var mq   = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }
  function current() {
    var s = stored();
    if (s === 'dark' || s === 'light') return s;
    return mq && mq.matches ? 'dark' : 'light';
  }
  function apply(theme) {
    root.setAttribute('data-theme', theme);
  }

  apply(current());

  /* follow the system until the user picks manually */
  if (mq && mq.addEventListener) {
    mq.addEventListener('change', function () {
      if (!stored()) apply(current());
    });
  }

  /* ---- circular reveal from (x, y) ---- */
  function switchTheme(next, x, y) {
    if (!document.startViewTransition || (mqReduce && mqReduce.matches)) {
      apply(next);
      return;
    }

    var radius = Math.hypot(
      Math.max(x, window.innerWidth  - x),
      Math.max(y, window.innerHeight - y)
    );

    root.classList.add('theme-switching');   /* stops color transitions from leaking into the snapshot */
    var vt = document.startViewTransition(function () { apply(next); });

    vt.ready.then(function () {
      root.animate(
        { clipPath: [
          'circle(0px at ' + x + 'px ' + y + 'px)',
          'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'
        ] },
        { duration: 750, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    }, function () {});

    vt.finished.then(
      function () { root.classList.remove('theme-switching'); },
      function () { root.classList.remove('theme-switching'); }
    );
  }

  /* ---- nav button: sun ⇄ moon ---- */
  function iconSvg() {
    var rays = '';
    for (var a = 0; a < 360; a += 45) {
      var r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
      rays += '<line x1="' + (12 + 8 * c).toFixed(2) + '" y1="' + (12 + 8 * s).toFixed(2) +
              '" x2="' + (12 + 10.5 * c).toFixed(2) + '" y2="' + (12 + 10.5 * s).toFixed(2) + '"/>';
    }
    return '<svg class="theme-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
      '<mask id="theme-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">' +
        '<rect width="24" height="24" fill="#fff"/>' +
        '<circle class="theme-cut" cx="12" cy="12" r="6.5" fill="#000"/>' +
      '</mask>' +
      '<g mask="url(#theme-mask)"><circle class="theme-core" cx="12" cy="12" r="5" fill="currentColor"/></g>' +
      '<g class="theme-rays" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' + rays + '</g>' +
    '</svg>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var links = document.querySelector('.nav-links');
    if (!links) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-icon-btn theme-toggle';
    btn.innerHTML = iconSvg();

    function label() {
      var dark = root.getAttribute('data-theme') === 'dark';
      var text = dark ? 'Switch to light theme' : 'Switch to dark theme';
      btn.setAttribute('aria-label', text);
      btn.title = text;
    }

    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      var box  = btn.getBoundingClientRect();

      save(next);
      switchTheme(next, box.left + box.width / 2, box.top + box.height / 2);
      label();
      if (window.Sfx) window.Sfx.theme(next === 'dark');
    });

    label();
    links.appendChild(btn);
  });
})();
