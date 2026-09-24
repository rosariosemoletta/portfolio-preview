/* ═══════════════════════════════════════════════
   MEDIA.JS — the media column of a project page

   Layout ("tetris"): the column is two half-width columns of very thin rows (2 px).
   Each item keeps its own shape and is never cropped (apart from a few pixels):
     • wide items (ratio ≥ 1.2) span the full width, tall and square ones take one half
     • half-width items go into the shorter column, so they interlock
     • before a wide item, a gap beside the last item is filled with later half-width
       items that fit in it (or the wide item itself is used at half width if it fits)
     • an item on its own is centered and as big as the window allows
   The shape of an item comes from the data (ratio: "16:9") or is measured from the file.

   Videos (every item has a role, see views.js):
     • "final": full player, sound, full screen (a play button for Vimeo / YouTube)
     • "draft": no controls, muted, looping while it is on screen, and it loads
       only when it comes near the screen
     • the FIRST item is also the "main" one: the piece the card grows into
     • while a final video plays, the background pad is ducked (Sfx.duck)
   ═══════════════════════════════════════════════ */

(function () {
  var GAP = 2, UNIT = 2;   /* px: must match .media-grid in style.css (gap and grid-auto-rows) */
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var current = null;      /* the page being shown: { grid, items, io, ro, alive } */

  function noop() {}
  function duck(on) { if (window.Sfx && window.Sfx.duck) window.Sfx.duck(on); }

  /* "16:9" | "1.78" | 1.78 → 1.78 (or the fallback) */
  function parseRatio(v, fallback) {
    if (typeof v === 'number' && v > 0) return v;
    if (typeof v === 'string') {
      var m = v.split(':');
      if (m.length === 2 && +m[0] > 0 && +m[1] > 0) return +m[0] / +m[1];
      if (parseFloat(v) > 0) return parseFloat(v);
    }
    return fallback;
  }

  /* a Vimeo / YouTube link → { provider, id }; anything else (a file) → null */
  function parseEmbed(src) {
    var m = /vimeo\.com\/(?:video\/)?(\d+)/.exec(src || '');
    if (m) return { provider: 'vimeo', id: m[1] };
    m = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/.exec(src || '');
    if (m) return { provider: 'youtube', id: m[1] };
    return null;
  }

  function embedUrl(provider, id, loop) {
    if (provider === 'vimeo') {
      return 'https://player.vimeo.com/video/' + id + (loop ? '?background=1&autoplay=1&loop=1&muted=1' : '?autoplay=1');
    }
    return 'https://www.youtube.com/embed/' + id +
           (loop ? '?autoplay=1&mute=1&controls=0&loop=1&playlist=' + id + '&playsinline=1&rel=0&modestbranding=1'
                 : '?autoplay=1&rel=0');
  }

  /* ---- layout ---- */

  /* how many 2 px rows an item of this width and shape needs */
  function rowsFor(w, ratio) { return Math.max(1, Math.round((w / ratio + GAP) / (UNIT + GAP))); }
  function isFull(it) { return it.force === 12 || (it.force !== 6 && it.ratio >= 1.2); }

  function layout(s) {
    var W = s.grid.clientWidth;
    if (!W) return;
    var items = s.items;

    /* one piece on its own: as big as the window allows, centered */
    if (items.length === 1) {
      var only = items[0];
      var w = Math.min(W, Math.max(320, window.innerHeight - 140) * only.ratio);
      only.el.style.width = w + 'px';
      only.el.style.justifySelf = 'center';
      only.el.style.gridColumn = '1 / -1';
      only.el.style.gridRow = '1 / span ' + rowsFor(w, only.ratio);
      return;
    }

    var half   = (W - GAP) / 2;
    var used   = [0, 0];       /* rows used so far in the left and in the right column */
    var lastIn = [null, null]; /* the last item placed in each column */
    var queue  = items.slice();
    var placed = [];

    function put(it, col, cols, row, rows) {
      var rec = { it: it, col: col, cols: cols, row: row, rows: rows };
      placed.push(rec);
      if (cols === 1) lastIn[col] = rec;
      return rec;
    }

    while (queue.length) {
      var it = queue.shift();

      if (!isFull(it)) {                       /* tall / square: the shorter column */
        var c = used[0] <= used[1] ? 0 : 1, r = rowsFor(half, it.ratio);
        put(it, c, 1, used[c], r);
        used[c] += r;
        continue;
      }

      /* a wide item needs both columns level: first deal with the gap beside the last item */
      var sh = used[0] <= used[1] ? 0 : 1;
      var gap = Math.abs(used[0] - used[1]);
      var halfRows = rowsFor(half, it.ratio);

      if (!it.main && it.force !== 12 && gap >= halfRows) {   /* it fits in the gap at half width: use it */
        put(it, sh, 1, used[sh], halfRows);
        used[sh] += halfRows;
        continue;
      }

      for (var j = 0; j < queue.length && gap > 0;) {          /* fill the gap with later half-width items */
        var cand = queue[j], cr = rowsFor(half, cand.ratio);
        if (!isFull(cand) && cr <= gap) {
          queue.splice(j, 1);
          put(cand, sh, 1, used[sh], cr);
          used[sh] += cr;
          gap -= cr;
        } else {
          j++;
        }
      }
      /* a small gap that is left: stretch the last item a few pixels (it is cropped, not distorted) */
      if (gap > 0 && lastIn[sh] && gap * (UNIT + GAP) <= Math.max(32, lastIn[sh].rows * (UNIT + GAP) * 0.06)) {
        lastIn[sh].rows += gap;
        used[sh] += gap;
      }

      var start = Math.max(used[0], used[1]), rows = rowsFor(W, it.ratio);
      put(it, 0, 2, start, rows);
      used[0] = used[1] = start + rows;
      lastIn = [null, null];
    }

    placed.forEach(function (p) {
      var el = p.it.el;
      el.style.width = '';
      el.style.justifySelf = '';
      el.style.gridColumn = p.cols === 2 ? '1 / span 12' : (p.col === 0 ? '1 / span 6' : '7 / span 6');
      el.style.gridRow = (p.row + 1) + ' / span ' + p.rows;
    });
  }

  function schedule(s) {
    if (s.queued) return;
    s.queued = true;
    requestAnimationFrame(function () { s.queued = false; if (s.alive) layout(s); });
  }

  /* ---- read the real ratio of an image or video file ---- */
  function measure(it) {
    return new Promise(function (resolve) {
      if (it.fixed || (it.kind !== 'image' && it.kind !== 'video')) return resolve();
      var settled = false, probe = null;
      var timer = setTimeout(function () { finish(0, 0); }, 4000);
      function finish(w, h) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (w && h) it.ratio = w / h;
        if (probe && probe.tagName === 'VIDEO') { probe.removeAttribute('src'); probe.load(); }   /* free the probe */
        resolve();
      }
      if (it.kind === 'image') {
        probe = new Image();
        probe.onload  = function () { finish(probe.naturalWidth, probe.naturalHeight); };
        probe.onerror = function () { finish(0, 0); };
        probe.src = it.el.querySelector('img').getAttribute('src');
      } else {
        probe = document.createElement('video');
        probe.preload = 'metadata';
        probe.muted = true;
        probe.onloadedmetadata = function () { finish(probe.videoWidth, probe.videoHeight); };
        probe.onerror = function () { finish(0, 0); };
        var vid = it.el.querySelector('video');
        probe.src = vid.getAttribute('src') || (vid.querySelector('source[type="video/mp4"]') || {}).src || '';
      }
    });
  }

  /* ---- video behavior ---- */
  function wireVideos(s) {
    /* drafts play only while visible; embedded drafts load when first visible */
    if ('IntersectionObserver' in window) {
      s.io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var it = e.target.__item;
          if (!it) return;
          if (it.kind === 'video') {
            var v = it.el.querySelector('video');
            v.muted = true;
            if (e.isIntersecting && !reduce) { if (v.preload === 'none') v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(noop); }
            else v.pause();
          } else if (it.kind === 'embed' && e.isIntersecting && !it.loaded) {
            it.loaded = true;
            var f = document.createElement('iframe');
            f.src = embedUrl(it.provider, it.id, true);
            f.allow = 'autoplay';
            f.setAttribute('title', '');
            f.setAttribute('tabindex', '-1');
            f.setAttribute('aria-hidden', 'true');
            it.el.appendChild(f);
          }
        });
      }, { threshold: 0.25 });
    }

    s.items.forEach(function (it) {
      it.el.__item = it;
      if (it.role === 'final') {
        if (it.kind === 'video') {                     /* a final video: duck the pad while it plays */
          var v = it.el.querySelector('video');
          v.addEventListener('play',  function () { duck(true); });
          v.addEventListener('pause', function () { duck(false); });
          v.addEventListener('ended', function () { duck(false); });
        }
      } else if (s.io && (it.kind === 'video' || it.kind === 'embed')) {
        s.io.observe(it.el);
      }
    });

    /* a final Vimeo / YouTube piece: a play button that swaps itself for the player */
    s.grid.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.media-play') : null;
      if (!btn) return;
      var el = btn.closest('.media-item'), it = el && el.__item;
      if (!it) return;
      var f = document.createElement('iframe');
      f.src = embedUrl(it.provider, it.id, false);
      f.allow = 'autoplay; fullscreen; picture-in-picture';
      f.allowFullscreen = true;
      f.setAttribute('title', 'Video');
      el.innerHTML = '';
      el.appendChild(f);
      duck(true);
    });
  }

  /* ---- public ---- */
  function init(root) {
    destroy();
    var grid = root.querySelector('.media-grid');
    if (!grid) return;

    var items = [].slice.call(grid.querySelectorAll('.media-item')).map(function (el) {
      var kind  = el.getAttribute('data-kind');
      var given = parseRatio(el.getAttribute('data-ratio'), 0);
      var span  = el.getAttribute('data-span');
      return {
        el: el, kind: kind,
        main: el.classList.contains('is-main'),
        role: el.getAttribute('data-role'),
        provider: el.getAttribute('data-provider'), id: el.getAttribute('data-id'),
        ratio: given || (kind === 'image' ? 4 / 3 : 16 / 9),   /* a guess until it is measured */
        fixed: !!given,
        force: span === 'full' ? 12 : span === 'half' ? 6 : 0
      };
    });

    var s = { grid: grid, items: items, io: null, ro: null, alive: true, queued: false };
    current = s;

    layout(s);   /* right away, with the guesses: the main item is already in place for the page transition */
    if (window.ResizeObserver) { s.ro = new ResizeObserver(function () { schedule(s); }); s.ro.observe(grid); }
    wireVideos(s);

    items.forEach(function (it) {
      measure(it).then(function () {
        if (!s.alive) return;
        schedule(s);
        it.el.classList.add('is-ready');   /* fades in once its real shape is known */
      });
    });
  }

  function destroy() {
    var s = current;
    if (!s) return;
    current = null;
    s.alive = false;
    if (s.io) s.io.disconnect();
    if (s.ro) s.ro.disconnect();
    s.items.forEach(function (it) {
      var v = it.el.querySelector('video');
      if (v) v.pause();
    });
    duck(false);
  }

  window.Media = { init: init, destroy: destroy, parseEmbed: parseEmbed, parseRatio: parseRatio };
})();
