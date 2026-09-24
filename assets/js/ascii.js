/* ═══════════════════════════════════════════════
   ASCII.JS — the About photo, rendered as monospace text

   Reads the photo (assets/img/rosario-bust-color.png, only its BRIGHTNESS) and turns it
   into a grid of characters, one per cell, from a fixed ramp. A depth map (the same one the
   dropped point-cloud experiment used) marks which cells are the person rather than the
   backdrop — those are always left blank, or a dark photo background would read as "maximum
   ink" and flood the whole box. The box itself has no background of its own once it is live:
   the page's technical grid (grid.js) shows straight through it, like everywhere else.

   In the light theme that reads as an ink drawing: shading where the photo is dark, blank
   page where it is bright. In the dark theme ink is pale on a dark page, so the same rule
   would put marks in the one place they cannot show (a pale mark needs a dark background to
   read against, not the reverse) — the mapping flips there instead, so the densest character
   falls on the BRIGHTEST parts of the photo, reading like a glow.

   Movement, skipped under "reduce motion":
     • on arrival, a slow reveal: nothing shows at first, then rows appear top to bottom,
       fully formed as they arrive — no scramble, no noise standing in for what is not shown
       yet, just more of the portrait becoming visible, like a scan or a blind lifting. A
       one-time thing, not a loop.
     • hovering the portrait brightens the cells near the pointer a little, like a torch —
       driven by the pointer events themselves, not a running timer, so nothing ticks in the
       background while the mouse is elsewhere.

   It is plain text (a <pre>, colored with color: var(--ink) in CSS): no canvas draw loop, no
   WebGL, so it costs nothing extra and needs no separate, lighter mobile version — this runs
   everywhere. The image is sampled once per box size (rebuilt on resize); a theme change only
   re-maps the cached brightness grid. If the photo fails to load, the plain <img> underneath
   (its normal src/alt) is left exactly as it is.

   Needs http(s)://, not file:// (double-clicking index.html): reading the photo's pixels to
   build the grid is blocked by the browser on file:// even for the site's own images.
   ═══════════════════════════════════════════════ */

(function () {
  var COLOR_SRC = 'assets/img/rosario-bust-color.png';
  var DEPTH_SRC = 'assets/img/rosario-bust-depth.png';   /* same depth map as the dropped point-cloud experiment:
                                                              only reused here to tell the person from the background */
  var RAMP = ' .:-=+*#%@';   /* light to dense, 10 steps (a well-worn ASCII-art ramp) */
  var LAST = RAMP.length - 1;
  var COLS = 70;             /* characters across; rows follow from the box's own shape */
  var CHAR_ASPECT = 0.58;    /* width:height of one monospace character cell, roughly */
  var FG_THRESHOLD = 0.2;    /* depth map value above which a cell counts as "the person", not backdrop */
  var REVEAL_MS = 2800;      /* the one-time reveal: slow, deliberate — a scan, not a flash */
  var HOVER_RADIUS = 6;      /* cells; how far the cursor's brightening reaches */

  var reduceMQ = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  function reduced() { return !!(reduceMQ && reduceMQ.matches); }   /* read live, not cached: init() runs on every visit, well after the page first loaded */
  var current = null;   /* the one portrait currently on screen, if any */
  var images = null;    /* [colorImg, depthImg], cached across About visits */
  var loading = null;   /* the in-flight load promise, so two inits don't both fetch it */

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }
  function loadPhoto() {
    if (images) return Promise.resolve(images);
    if (loading) return loading;
    loading = Promise.all([loadImage(COLOR_SRC), loadImage(DEPTH_SRC)]).then(function (imgs) {
      images = imgs;
      return imgs;
    });
    return loading;
  }

  function readInk() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
    var m = /^#([0-9a-f]{6})$/i.exec(v);
    if (!m) return 0.05;
    var n = parseInt(m[1], 16);
    return (((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255)) / 3 / 255;
  }
  function isLightTheme() { return readInk() < 0.5; }   /* dark ink = light page */

  /* the biggest centered crop of `img` that matches the box's shape, same idea as object-fit: cover */
  function coverCrop(img, boxRatio) {
    var w = img.naturalWidth, h = img.naturalHeight, r = w / h;
    var cw = r >= boxRatio ? h * boxRatio : w;
    var ch = r >= boxRatio ? h : w / boxRatio;
    return { x: (w - cw) / 2, y: (h - ch) / 2, w: cw, h: ch };
  }

  /* one image → a cols x rows grid of 0..1 values, cropped to match the box's shape */
  function sampleOne(img, cols, rows) {
    var c = document.createElement('canvas');
    c.width = cols; c.height = rows;
    var g = c.getContext('2d');
    var crop = coverCrop(img, (cols * CHAR_ASPECT) / rows);   /* the grid's real width:height, in box-pixel terms */
    g.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, cols, rows);
    var d = g.getImageData(0, 0, cols, rows).data;
    var out = new Float32Array(cols * rows);
    for (var i = 0, p = 0; i < out.length; i++, p += 4) {
      out[i] = (d[p] * 0.2126 + d[p + 1] * 0.7152 + d[p + 2] * 0.0722) / 255;
    }
    return out;
  }

  /* brightness + depth → one ramp index per cell, or -1 for "backdrop, always blank".
     Recomputed on resize and on a theme change (the mapping direction flips, see the header). */
  function computeIdx(s) {
    var light = isLightTheme();
    var idx = new Int16Array(s.cols * s.rows);
    for (var i = 0; i < idx.length; i++) {
      if (s.depth[i] < FG_THRESHOLD) { idx[i] = -1; continue; }
      var vis = light ? 1 - s.gray[i] : s.gray[i];   /* which end of the brightness range "shows" */
      idx[i] = Math.round(vis * LAST);
    }
    s.baseIdx = idx;
  }

  /* baseIdx (+ an optional per-cell override, for the cursor's glow) → the text.
     `upTo` (default: every row) lets the reveal show only the rows that have arrived so far. */
  function stringify(s, overrides, upTo) {
    var rows = upTo == null ? s.rows : upTo;
    var out = new Array(s.rows);
    for (var y = 0; y < s.rows; y++) {
      if (y >= rows) { out[y] = ''; continue; }   /* not revealed yet: genuinely nothing, not noise */
      var row = '';
      for (var x = 0; x < s.cols; x++) {
        var i = y * s.cols + x;
        var idx = s.baseIdx[i];
        if (idx < 0) { row += RAMP.charAt(0); continue; }
        var ov = overrides && overrides[i];
        row += ov ? ov : RAMP.charAt(idx);
      }
      out[y] = row;
    }
    return out.join('\n');
  }

  /* the cursor's local glow: a small boost to the ramp index for foreground cells near it */
  function hoverOverrides(s) {
    if (s.hoverCol == null) return null;
    var out = Object.create(null);
    var r = HOVER_RADIUS;
    for (var y = Math.max(0, s.hoverRow - r); y <= Math.min(s.rows - 1, s.hoverRow + r); y++) {
      for (var x = Math.max(0, s.hoverCol - r); x <= Math.min(s.cols - 1, s.hoverCol + r); x++) {
        var i = y * s.cols + x, idx = s.baseIdx[i];
        if (idx < 0) continue;
        var d = Math.hypot(x - s.hoverCol, y - s.hoverRow);
        if (d >= r) continue;
        var boosted = Math.min(LAST, idx + Math.round((1 - d / r) * 3));
        out[i] = RAMP.charAt(boosted);
      }
    }
    return out;
  }

  /* the steady-state render: the real picture, plus the cursor's glow if the pointer is over it.
     Called after the reveal is done, and on every pointer move / theme change / resize. */
  function renderNow(s) { s.pre.textContent = stringify(s, hoverOverrides(s)); }

  /* the one-time reveal: rows arrive top to bottom, fully formed — nothing stands in for a
     row that has not arrived yet, so it reads as the portrait becoming visible, not resolving
     out of noise. Slow and deliberate on purpose (see REVEAL_MS). */
  function reveal(s) {
    if (reduced()) { renderNow(s); return; }
    var start = performance.now(), last = 0;
    function frame(now) {
      if (!current || current !== s) return;   /* the page moved on */
      if (now - last < 40) { s.raf = requestAnimationFrame(frame); return; }
      last = now;
      var t = Math.min(1, (now - start) / REVEAL_MS);
      s.pre.textContent = stringify(s, null, Math.floor(t * s.rows));
      if (t < 1) { s.raf = requestAnimationFrame(frame); return; }
      s.raf = 0;
      s.revealed = true;
      renderNow(s);   /* picks up the cursor's glow, if the pointer is already over it */
    }
    s.raf = requestAnimationFrame(frame);
  }

  function layout(s, first) {
    var w = s.box.clientWidth, h = s.box.clientHeight;
    if (!w || !h) return;
    var cols = COLS, rows = Math.max(1, Math.round(cols * CHAR_ASPECT * (h / w)));
    var fontSize = w / cols / CHAR_ASPECT;
    s.pre.style.fontSize = fontSize.toFixed(2) + 'px';
    s.pre.style.lineHeight = fontSize.toFixed(2) + 'px';
    if (cols !== s.cols || rows !== s.rows) {
      s.cols = cols; s.rows = rows;
      s.gray = sampleOne(s.images[0], cols, rows);
      s.depth = sampleOne(s.images[1], cols, rows);
    }
    computeIdx(s);
    if (first) reveal(s);
    else if (s.revealed) renderNow(s);   /* a genuine resize after the reveal is done */
    /* else: the box resized (or the ResizeObserver's obligatory first firing, which happens
       even with no real resize) while the reveal is still running — the running loop already
       reads s.cols/s.rows/s.baseIdx fresh every frame, so it will pick up the new grid on its
       own; forcing a render here would flash the whole portrait in before its time */
  }

  function init(root) {
    stop();
    var box = root.querySelector('.about-photo');
    if (!box) return;
    loadPhoto().then(function (imgs) {
      if (!root.isConnected || root.querySelector('.about-photo') !== box) return;   /* left the page already */
      var pre = document.createElement('pre');
      pre.className = 'ascii-portrait';
      pre.setAttribute('aria-hidden', 'true');   /* the <img>'s alt text still carries the meaning */
      box.appendChild(pre);
      box.classList.add('ascii-live');

      var s = {
        box: box, pre: pre, images: imgs, cols: 0, rows: 0, gray: null, depth: null, baseIdx: null,
        hoverCol: null, hoverRow: null, revealed: false, ro: null, mo: null, raf: 0
      };
      current = s;

      layout(s, true);
      box.classList.add('is-ready');

      s.ro = new ResizeObserver(function () { layout(s, false); });
      s.ro.observe(box);
      s.mo = new MutationObserver(function () { computeIdx(s); if (!s.raf) renderNow(s); });
      s.mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

      box.addEventListener('pointermove', function (e) {
        var r = box.getBoundingClientRect();
        s.hoverCol = Math.floor((e.clientX - r.left) / r.width * s.cols);
        s.hoverRow = Math.floor((e.clientY - r.top) / r.height * s.rows);
        if (s.revealed) renderNow(s);   /* while still revealing, the glow just waits its turn */
      }, { passive: true });
      box.addEventListener('pointerleave', function () {
        s.hoverCol = s.hoverRow = null;
        if (s.revealed) renderNow(s);
      });
    }).catch(function () { /* no photo yet: the plain <img> (missing too, today) is left as is */ });
  }

  function stop() {
    var s = current;
    if (!s) return;
    current = null;
    if (s.raf) cancelAnimationFrame(s.raf);
    if (s.ro) s.ro.disconnect();
    if (s.mo) s.mo.disconnect();
    if (s.pre.parentNode) s.pre.parentNode.removeChild(s.pre);
    s.box.classList.remove('ascii-live', 'is-ready');
  }

  window.Ascii = { init: init, destroy: stop };
})();
