/* ═══════════════════════════════════════════════
   GRID.JS — the technical grid behind the site

   A hairline grid with a small "+" (a registration mark) at every crossing, like the
   viewport of a compositing app. It lives on one fixed canvas behind everything.
     • near the mouse the crosses grow and brighten, and the crossing closest to the
       pointer gets a registration circle
     • the crosses swell a hair with the bass of the pad (Sfx.subscribe)
     • when the carousel changes card (event "carousel:focus") a ring travels outward from
       the middle, like a lock-on
   It only redraws while something moves. With reduced motion it is a still grid.
   Colors come from --ink, so both themes work.
   ═══════════════════════════════════════════════ */

(function () {
  var canvas = document.createElement('canvas');
  canvas.id = 'grid-bg';
  canvas.setAttribute('aria-hidden', 'true');
  var g = canvas.getContext && canvas.getContext('2d');
  if (!g) return;
  document.body.insertBefore(canvas, document.body.firstChild);

  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var W = 0, H = 0, dpr = 1, S = 80;         /* size of the window, pixel ratio, size of a grid cell */
  var rgb = '13,13,13';                      /* the ink color, as "r,g,b" */
  /* strengths (alpha of the ink): the grid line, a cross, the extra near the pointer, the extra with the
     bass, the lock-on ring. Dark ink on a pale page shows far more than pale ink on a dark page, so the
     light theme is softer, so that text over a cross keeps a readable contrast. */
  var A = { line: 0.05, cross: 0.2, near: 0.7, bass: 0.12, ring: 0.6 };
  var FAR = -9999;
  var cur = { x: FAR, y: FAR }, tgt = { x: FAR, y: FAR };   /* smoothed and real pointer position */
  var pulse = 0, pulseT = 0;                 /* bass, smoothed and real */
  var wave = 0;                              /* start time of the lock-on ring (0 = none) */
  var WAVE_MS = 1000;
  var raf = 0;

  function readInk() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
    var m = /^#([0-9a-f]{6})$/i.exec(v);
    if (m) {
      var n = parseInt(m[1], 16), r = (n >> 16) & 255;
      rgb = [r, (n >> 8) & 255, n & 255].join(',');
      A = r < 128 ? { line: 0.035, cross: 0.13, near: 0.32, bass: 0.08, ring: 0.4 }      /* dark ink: light theme */
                  : { line: 0.05, cross: 0.2, near: 0.7, bass: 0.12, ring: 0.6 };
    }
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    S = W < 700 ? 56 : 80;
    draw(performance.now());
  }

  function draw(now) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);

    /* the grid is centered on the window, so it is symmetric */
    var ox = (W / 2) % S, oy = (H / 2) % S;
    var x, y;

    g.lineWidth = 1;
    g.strokeStyle = 'rgba(' + rgb + ',' + A.line + ')';
    g.beginPath();
    for (x = ox; x <= W; x += S) { var px = Math.round(x) + 0.5; g.moveTo(px, 0); g.lineTo(px, H); }
    for (y = oy; y <= H; y += S) { var py = Math.round(y) + 0.5; g.moveTo(0, py); g.lineTo(W, py); }
    g.stroke();

    var R      = Math.min(260, W * 0.3);       /* reach of the pointer */
    var cx     = W / 2, cy = H / 2;
    var ring   = -1, ringFade = 0, maxR = Math.sqrt(cx * cx + cy * cy);
    if (wave) {
      var p = (now - wave) / WAVE_MS;
      if (p >= 1) wave = 0; else { ring = p * maxR; ringFade = 1 - p; }
    }

    var bestD = 1e9, bx = 0, by = 0;
    for (x = ox; x <= W; x += S) {
      for (y = oy; y <= H; y += S) {
        var sx = Math.round(x) + 0.5, sy = Math.round(y) + 0.5;
        var dx = sx - cur.x, dy = sy - cur.y, d = Math.sqrt(dx * dx + dy * dy);
        var k = d < R ? 1 - d / R : 0; k *= k;
        var w = 0;
        if (ring >= 0) { var dr = Math.abs(Math.sqrt((sx - cx) * (sx - cx) + (sy - cy) * (sy - cy)) - ring); w = ringFade * Math.max(0, 1 - dr / 90); }
        var arm = 3 + k * 7 + w * 4 + pulse * 2.5;
        var a   = A.cross + k * A.near + w * A.ring + pulse * A.bass;
        g.strokeStyle = 'rgba(' + rgb + ',' + Math.min(1, a).toFixed(3) + ')';
        g.beginPath();
        g.moveTo(sx - arm, sy); g.lineTo(sx + arm, sy);
        g.moveTo(sx, sy - arm); g.lineTo(sx, sy + arm);
        g.stroke();
        if (d < bestD) { bestD = d; bx = sx; by = sy; }
      }
    }

    /* the crossing closest to the pointer gets a registration circle */
    var near = S * 0.75;
    if (bestD < near) {
      g.strokeStyle = 'rgba(' + rgb + ',' + (0.75 * (1 - bestD / near)).toFixed(3) + ')';
      g.beginPath(); g.arc(bx, by, 6, 0, Math.PI * 2); g.stroke();
    }
  }

  /* redraw only while something is still moving */
  function tick(now) {
    raf = 0;
    cur.x += (tgt.x - cur.x) * 0.18;
    cur.y += (tgt.y - cur.y) * 0.18;
    pulse += (pulseT - pulse) * 0.25;
    draw(now);
    if (wave || Math.abs(tgt.x - cur.x) > 0.4 || Math.abs(tgt.y - cur.y) > 0.4 || Math.abs(pulseT - pulse) > 0.003) {
      raf = requestAnimationFrame(tick);
    }
  }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }

  readInk();
  resize();
  window.addEventListener('resize', resize);

  /* theme change: read the ink color again */
  new MutationObserver(function () { readInk(); draw(performance.now()); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  if (reduce) return;   /* a still grid */

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    if (tgt.x === FAR) { cur.x = e.clientX; cur.y = e.clientY; }   /* first move: no sweep from nowhere */
    tgt.x = e.clientX; tgt.y = e.clientY;
    kick();
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () {
    tgt.x = tgt.y = cur.x = cur.y = FAR;
    kick();
  });

  if (window.Sfx && window.Sfx.subscribe) {
    window.Sfx.subscribe(function (b) { pulseT = b[0]; kick(); });
  }

  window.addEventListener('carousel:focus', function () { wave = performance.now(); kick(); });
})();
