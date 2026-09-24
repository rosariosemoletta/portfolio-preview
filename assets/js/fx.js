/* ═══════════════════════════════════════════════
   FX.JS — small interface touches
     • Decode(el, text)     title text that "decodes" letter by letter
     • custom cursor        a tech-minimal cursor: a square dot, a square reticle and a
                            rectangular "Open" / "View" tag over cards (mouse only)
     • Work filters         category chips that reflow the grid with an animation
     • copy buttons         [data-copy="text"] copies it and confirms
     • project pages        ← → keys and horizontal swipe = previous / next project
     • timecode             the footer counts the time you spend here, like a film timecode
     • console message      a hello for anyone who opens the developer tools
   ═══════════════════════════════════════════════ */

(function () {
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var fine   = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  var view   = document.getElementById('view');

  /* ---- Decode: letters scramble, then settle left to right ---- */
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_-+=';
  window.Decode = function (el, text) {
    if (el.__decodeRaf) cancelAnimationFrame(el.__decodeRaf);
    if (reduce) { el.textContent = text; return; }

    var start = performance.now(), last = 0, DURATION = 520, len = text.length;
    function frame(now) {
      if (now - last < 40) { el.__decodeRaf = requestAnimationFrame(frame); return; }   /* ~25 fps: readable, not frantic */
      last = now;
      var t = Math.min(1, (now - start) / DURATION);
      var settled = Math.floor(t * len);
      var out = '';
      for (var i = 0; i < len; i++) {
        var ch = text.charAt(i);
        out += (i < settled || ch === ' ') ? ch : GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
      }
      el.textContent = t < 1 ? out : text;
      if (t < 1) el.__decodeRaf = requestAnimationFrame(frame);
    }
    el.__decodeRaf = requestAnimationFrame(frame);
  };

  /* ---- custom cursor (mouse only) ----
     A small square dot exactly under the pointer and a thin square "reticle" that trails it.
     Both use a difference blend, so they read on any background: light, dark or an image.
       • over links and buttons the reticle turns into a small diamond
       • while the button is pressed it tightens
       • over an element with data-cursor="Label" (the carousel cards, the Work cards) the
         reticle gives way to a small rectangular tag with that label, hanging off the pointer
       • over videos and embedded players the normal cursor comes back
     The state is kept as classes on <html> (cur-link, cur-label, cur-down, cur-off). */
  if (fine) {
    var root = document.documentElement;
    var dot  = document.createElement('div');  dot.id  = 'cursor-dot';
    var ring = document.createElement('div');  ring.id = 'cursor-ring';
    var tip  = document.createElement('div');  tip.id  = 'cursor-tag';
    var parts = [dot, ring, tip];
    parts.forEach(function (el) {
      el.setAttribute('aria-hidden', 'true');
      el.classList.add('is-hidden');           /* invisible until the mouse first moves */
      document.body.appendChild(el);
    });
    root.classList.add('has-cursor');

    var x = -100, y = -100, rx = x, ry = y, cRaf = 0, shown = false;

    /* the individual `translate` property, so it never fights with the scale / rotate transitions */
    var place = function (el, px, py) { el.style.translate = px.toFixed(1) + 'px ' + py.toFixed(1) + 'px'; };

    var tick = function () {
      var k = reduce ? 1 : 0.2;                /* the reticle trails the pointer */
      rx += (x - rx) * k;
      ry += (y - ry) * k;
      place(ring, rx, ry);
      place(tip, rx, ry);
      cRaf = (Math.abs(x - rx) > 0.3 || Math.abs(y - ry) > 0.3) ? requestAnimationFrame(tick) : 0;
    };

    var show = function () {
      shown = true;
      rx = x; ry = y;
      place(ring, rx, ry);
      place(tip, rx, ry);
      parts.forEach(function (el) { el.classList.remove('is-hidden'); });
    };
    var hide = function () {
      shown = false;
      parts.forEach(function (el) { el.classList.add('is-hidden'); });
    };

    window.addEventListener('mousemove', function (e) {
      x = e.clientX;
      y = e.clientY;
      place(dot, x, y);                        /* the dot is always exactly on the pointer */
      if (!shown) show();

      var t     = e.target;
      var lab   = t && t.closest ? t.closest('[data-cursor]') : null;
      var name  = lab ? lab.getAttribute('data-cursor') : '';
      if (name && tip.textContent !== name) tip.textContent = name;
      root.classList.toggle('cur-label', !!name);
      root.classList.toggle('cur-link', !name && !!(t && t.closest && t.closest('a, button, [role="link"], summary')));
      root.classList.toggle('cur-off', !!(t && t.closest && t.closest('iframe, video')));
      if (!cRaf) cRaf = requestAnimationFrame(tick);
    }, { passive: true });

    document.addEventListener('mousedown', function () { root.classList.add('cur-down'); }, true);
    document.addEventListener('mouseup',   function () { root.classList.remove('cur-down'); }, true);
    root.addEventListener('mouseleave', hide);
  }

  /* ---- Work filters: hide / show cards, and animate the others into their new places (FLIP) ---- */
  function applyFilter(chip) {
    var grid = document.querySelector('.projects-grid');
    if (!grid) return;
    var tag   = chip.getAttribute('data-tag');
    var chips = [].slice.call(document.querySelectorAll('.filters .chip'));
    chips.forEach(function (c) {
      var on = c === chip;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', String(on));
    });

    var cards = [].slice.call(grid.children);
    var first = cards.map(function (c) { return c.getBoundingClientRect(); });          /* before */
    cards.forEach(function (c) { c.hidden = !!tag && c.getAttribute('data-tag') !== tag; });

    if (window.Sfx) window.Sfx.tick(chips.indexOf(chip), 1);
    if (reduce || !cards[0].animate) return;

    cards.forEach(function (c, i) {                                                     /* after */
      if (c.hidden) return;
      var f = first[i], l = c.getBoundingClientRect();
      if (f.width === 0 && f.height === 0) {           /* it was hidden: fade in */
        c.animate([{ opacity: 0, transform: 'scale(0.94)' }, { opacity: 1, transform: 'none' }],
                  { duration: 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      } else {                                         /* it moved: slide from the old place */
        var dx = f.left - l.left, dy = f.top - l.top;
        if (dx || dy) c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }],
                                { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      }
    });
  }

  /* ---- copy buttons ---- */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {     /* older browsers / non-secure pages */
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      ok ? resolve() : reject();
    });
  }

  function copyDone(btn) {
    if (!btn.hasAttribute('data-label')) btn.setAttribute('data-label', btn.textContent);
    btn.textContent = 'Copied ✓';
    btn.classList.add('is-done');
    if (window.Sfx) window.Sfx.confirm();
    clearTimeout(btn.__copyTimer);
    btn.__copyTimer = setTimeout(function () {
      btn.textContent = btn.getAttribute('data-label');
      btn.classList.remove('is-done');
    }, 1700);
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var copy = t.closest('[data-copy]');
    if (copy) {
      var text = copy.getAttribute('data-copy');
      if (text === 'mailto') {   /* copy the address of the mailto link on the same row */
        var a = copy.closest('.contact-link-row').querySelector('a[href^="mailto:"]');
        text = a ? a.getAttribute('href').replace('mailto:', '') : '';
      }
      copyText(text).then(function () { copyDone(copy); }, function () {});
      return;
    }
    var chip = t.closest('.filters .chip');
    if (chip) applyFilter(chip);
  });

  /* ---- project pages: the "← Home" link reopens Home on the card you were viewing ---- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.pj-back');
    if (!a) return;
    var id = a.getAttribute('data-home-card');
    /* runs before the browser follows the link's own href="#/", so the carousel
       is already pointed at the right card by the time Home re-renders */
    if (id && window.HomeCarousel) window.HomeCarousel.focus(id);
  });

  /* ---- project pages: ← → and swipe move between projects ---- */
  function projectLink(dir) {
    return document.querySelector('#view .project-nav .' + (dir < 0 ? 'pn-prev' : 'pn-next'));
  }
  function goProject(dir) {
    var a = projectLink(dir);
    if (a) location.hash = a.getAttribute('href');
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (document.documentElement.getAttribute('data-view') !== 'page') return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    goProject(e.key === 'ArrowLeft' ? -1 : 1);
  });

  if (view) {
    var sx = 0, sy = 0, st = 0;
    view.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
    }, { passive: true });
    view.addEventListener('touchend', function (e) {
      if (!view.querySelector('.project-nav')) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      /* a deliberate, mostly horizontal, quick swipe */
      if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 1.6 || Date.now() - st > 600) return;
      goProject(dx > 0 ? -1 : 1);   /* swipe right = previous, swipe left = next */
    }, { passive: true });
  }

  /* ---- timecode: the footer counts the time since you entered, as HH:MM:SS:FF at 24 fps ---- */
  var tcEls = document.querySelectorAll('.timecode');
  if (tcEls.length) {
    var tcStart = window.__gateDone ? performance.now() : null;   /* starts when the entry gate opens */
    var tcLast  = '';
    var two = function (n) { return (n < 10 ? '0' : '') + n; };

    var tcFrame = function (now) {
      requestAnimationFrame(tcFrame);
      var ms     = tcStart === null ? 0 : now - tcStart;
      var secs   = Math.floor(ms / 1000);
      var frames = reduce ? 0 : Math.floor((ms % 1000) / (1000 / 24));   /* no racing digits with reduced motion */
      var text = 'TC ' + two(Math.floor(secs / 3600)) + ':' + two(Math.floor(secs / 60) % 60) + ':' +
                 two(secs % 60) + ':' + two(frames);
      if (text === tcLast) return;
      tcLast = text;
      for (var i = 0; i < tcEls.length; i++) tcEls[i].textContent = text;
    };
    window.addEventListener('gate:done', function () { if (tcStart === null) tcStart = performance.now(); });
    requestAnimationFrame(tcFrame);
  }

  /* ---- a hello for anyone who opens the developer tools ---- */
  try {
    var t    = document.getElementById('tpl-contact');
    var link = t && t.content && t.content.querySelector('a[href^="mailto:"]');
    var mail = link ? link.getAttribute('href').replace('mailto:', '') : '';
    var mono = '"IBM Plex Mono", monospace';
    console.log('%cRosario Semoletta%c Motion & Visual Designer',
                'font:500 15px/1.8 ' + mono + ';color:#fff;background:#0d0d0d;padding:2px 10px',
                'font:12px/1.8 ' + mono + ';color:#888;padding-left:10px');
    console.log('%cLooking under the hood? Let’s talk' + (mail ? ' → ' + mail : ''),
                'font:12px ' + mono + ';color:#c8543a');
    console.log('%cThis site is a single page written by hand in plain HTML, CSS and JavaScript. Every sound is synthesized live in your browser.',
                'font:11px ' + mono + ';color:#888');
  } catch (e) {}
})();
