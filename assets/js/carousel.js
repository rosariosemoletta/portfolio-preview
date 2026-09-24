/* ═══════════════════════════════════════════════
   CAROUSEL.JS — Rosario Semoletta
   Horizontal arc carousel, hover to focus

   The router (router.js) calls HomeCarousel.enter() every time the home page
   comes on screen (once the entry gate is open): the cards fan out from the
   center. HomeCarousel.leave() resets it when another section is opened.

   Ways to move: hover, drag / swipe, mouse wheel / trackpad, ← → keys, Tab.
   The focused card sets the pad's mood (projects.js: mood) and "breathes"
   with the sound.

   Camera look: the cards away from the center are softer (rack focus), and when a card
   takes focus the lens "hunts" a little before it settles, four focus brackets close in on
   it, a quick RGB split flickers across it, and a slate line under it gives its number,
   category, year and shape.
   Each change also fires the event "carousel:focus" (the grid in grid.js reacts to it).
   ═══════════════════════════════════════════════ */

(function () {
  if (typeof PROJECTS === 'undefined') return;
  var container = document.getElementById('carousel');
  if (!container) return;

  var N      = PROJECTS.length;
  var active = Math.floor(N / 2);   /* the card in focus: the middle one, unless a project is "featured" */
  PROJECTS.forEach(function (p, i) { if (p.featured && active === Math.floor(N / 2)) active = i; });
  var cards   = [];
  var ready   = false;   /* true once the intro is over and the carousel can be used */
  var running = false;   /* true from enter() until leave() */
  var timers  = [];

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* ── build the cards ── */
  PROJECTS.forEach(function (p, i) {
    var card = document.createElement('div');
    card.className = 'c-card';
    card.style.setProperty('--i', i);
    card.setAttribute('role', 'link');
    card.setAttribute('aria-label', p.title + ', ' + p.tag);
    card.setAttribute('data-cursor', 'Open');   /* label of the custom cursor (fx.js) */
    card.tabIndex = -1;                         /* becomes 0 once the carousel is ready */

    if (p.cover) {
      card.innerHTML = '<img src="' + p.cover + '" alt="' + p.title + '" draggable="false">';
    } else {
      /* colored placeholder until the images are available */
      card.innerHTML =
        '<div class="c-placeholder" style="background:' + (p.color || '#e0ddd8') + ';">' +
          '<div class="c-blob" style="background:' + (p.blob || '#bbb') + ';"></div>' +
          '<div class="c-placeholder-text">' +
            '<span class="c-placeholder-tag">' + p.tag.toUpperCase() + '</span>' +
            '<span class="c-placeholder-title">' + p.title + '</span>' +
          '</div>' +
        '</div>';
    }

    /* the picture as three colour channels, shown for an instant on focus: the RGB split (cards with a cover) */
    if (p.cover) {
      var fxBg = 'style="background-image:url(\'' + p.cover + '\')"';
      card.insertAdjacentHTML('beforeend', '<i class="fx fx-r" ' + fxBg + '></i><i class="fx fx-g" ' + fxBg + '></i><i class="fx fx-b" ' + fxBg + '></i>');
    }
    card.insertAdjacentHTML('beforeend', '<i class="fb fb-tl"></i><i class="fb fb-tr"></i><i class="fb fb-bl"></i><i class="fb fb-br"></i><i class="fb-c"></i>');

    card.addEventListener('click', function () {
      if (!ready) return;
      location.hash = '#/project/' + p.id;
    });
    /* keyboard: Tab brings a card to the center, Enter / Space opens it */
    card.addEventListener('focus', function () { if (ready) setActive(i); });
    card.addEventListener('keydown', function (e) {
      if (ready && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        location.hash = '#/project/' + p.id;
      }
    });

    container.appendChild(card);
    cards.push(card);
  });

  /* ── title (a link to the active project) ── */
  var labelEl = document.getElementById('carousel-label');
  var titleEl = document.getElementById('carousel-title');

  /* the slate under the active card */
  var slateEl = document.createElement('div');
  slateEl.id = 'carousel-slate';
  slateEl.setAttribute('aria-hidden', 'true');
  container.appendChild(slateEl);
  function slateText(i) {
    var p = PROJECTS[i], two = function (n) { return (n < 10 ? '0' : '') + n; };
    var parts = [two(i + 1) + ' / ' + two(N), String(p.tag || '').toUpperCase(), p.year];
    var m = p.media && p.media[0];
    if (m && m.ratio) parts.push(m.ratio);
    return parts.filter(Boolean).join('  ·  ');
  }

  /* ── card size: depends on the screen, and sets the height of the carousel
        so the title always sits right above the cards ── */
  var cardW = 300;
  function sizeCards() {
    var W = window.innerWidth, H = window.innerHeight;
    var w = W < 700 ? Math.min(260, W * 0.58) : Math.min(300, W * 0.21);
    w = Math.min(w, H * 0.56 * 0.75);        /* never taller than 56% of the screen */
    cardW = Math.max(110, w);
    container.style.setProperty('--card-w', cardW + 'px');
  }

  /* the gap between two neighbouring cards' centers, given the current card size */
  function spacing() { return cardW * (window.innerWidth < 700 ? 0.62 : 0.78); }

  /* ── target position of card i, given the current (possibly fractional) position ──
     `pos` defaults to the settled `active` index; a touch drag passes a continuous
     value instead, so the whole arc can ease under the finger instead of only ever
     snapping between whole cards. */
  function layout(i, pos) {
    var SPACING    = spacing();
    var SCALE_STEP = 0.12;
    var p       = pos == null ? active : pos;
    var dist    = i - p;
    var absDist = Math.abs(dist);
    return {
      tx:      dist * SPACING,
      ty:      absDist * absDist * 3,
      scale:   Math.max(0.38, 1 - absDist * SCALE_STEP),
      opacity: Math.max(0.28, 1 - absDist * 0.16),
      z:       100 - absDist * 10,
      blur:    absDist < 0.05 ? 0 : Math.min(0.9 + absDist * 0.7, 3)   /* px: rack focus */
    };
  }

  /* the transform list always has the same functions in the same order,
     so the browser can interpolate between any two states (incl. rotate) */
  function place(card, L, rot) {
    card.style.transform =
      'translateX(' + L.tx + 'px) translateY(' + L.ty + 'px) ' +
      'scale(' + L.scale + ') rotate(' + (rot || 0) + 'deg)';
    /* the card stays opaque; it fades into the page with an overlay (--fade, see home.css), so the
       grid behind never shows through it */
    card.style.opacity = L.opacity > 0 ? 1 : 0;
    card.style.setProperty('--fade', (1 - L.opacity).toFixed(3));
    card.style.zIndex  = L.z;
    card.style.filter  = L.blur ? 'blur(' + L.blur + 'px)' : 'none';
  }

  /* ── render positions ── */
  function render() {
    cards.forEach(function (card, i) {
      place(card, layout(i), 0);
      card.classList.toggle('is-active', ready && i === active);
    });

    var p = PROJECTS[active];
    if (p && titleEl) {
      titleEl.href = '#/project/' + p.id;
      titleEl.setAttribute('aria-label', p.title);
      if (titleEl.getAttribute('data-shown') !== p.id) {
        titleEl.setAttribute('data-shown', p.id);
        /* once visible, a new title "decodes" letter by letter (fx.js) */
        if (window.Decode && ready) window.Decode(titleEl, p.title);
        else titleEl.textContent = p.title;
      }
      if (labelEl && ready) labelEl.classList.add('visible');
      if (slateEl.getAttribute('data-shown') !== p.id) {
        slateEl.setAttribute('data-shown', p.id);
        if (window.Decode && ready) window.Decode(slateEl, slateText(active));
        else slateEl.textContent = slateText(active);
      }
      slateEl.classList.toggle('visible', ready);
    }
  }

  /* mid-drag: only the positions move (1:1 with the finger, no CSS easing — the
     caller turns transitions off first); title/slate/sound stay on the settled
     card until the drag actually commits via setActive() */
  function renderDrag(pos) {
    cards.forEach(function (card, i) { place(card, layout(i, pos), 0); });
  }

  function setInteractive(on) {
    cards.forEach(function (c) { c.tabIndex = on ? 0 : -1; });
  }

  /* the focused card "breathes": its picture swells a hair with the bass of the pad */
  var stopPulse = null;
  function startPulse() {
    if (reduceMotion || !window.Sfx || stopPulse) return;
    var unsub = window.Sfx.subscribe(function (b) {
      var c = cards[active];
      if (c) c.style.setProperty('--pulse', b[0].toFixed(3));
    });
    stopPulse = function () {
      unsub();
      stopPulse = null;
      cards.forEach(function (c) { c.style.removeProperty('--pulse'); });
    };
  }

  function cardFor(id) {
    for (var i = 0; i < PROJECTS.length; i++) if (PROJECTS[i].id === id) return cards[i];
    return null;
  }

  /* jump straight to a project's card with no animation, before it is shown again —
     used by the project page's "← Home" link so Home reopens on the project you were
     just looking at, not wherever the carousel happened to be left */
  function focus(id) {
    for (var i = 0; i < PROJECTS.length; i++) {
      if (PROJECTS[i].id === id) { active = i; return; }
    }
  }

  /* the lens "hunts": the card sharpens, softens a touch again, and settles (steps of a CSS transition) */
  var huntTimers = [];
  function huntFocus(card) {
    huntTimers.forEach(clearTimeout); huntTimers = [];
    if (reduceMotion) return;
    card.classList.remove('glitch'); void card.offsetWidth; card.classList.add('glitch');   /* RGB split, ~0.3 s */
    huntTimers.push(setTimeout(function () { card.classList.remove('glitch'); }, 360));
    huntTimers.push(setTimeout(function () { card.style.filter = 'blur(1.2px)'; }, 380));
    huntTimers.push(setTimeout(function () { card.style.filter = 'none'; }, 640));
  }

  function setActive(idx) {
    if (!ready || idx === active) return;
    var dir = idx > active ? 1 : -1;
    cards[active].style.removeProperty('--pulse');
    active = idx;
    render();
    huntFocus(cards[idx]);
    window.dispatchEvent(new Event('carousel:focus'));
    /* a light tap on devices with real haptics (mainly Android; iOS Safari has no
       Vibration API at all, so this is silently a no-op there, not a bug) */
    if (navigator.vibrate) navigator.vibrate(8);
    if (window.Sfx) {
      window.Sfx.tick(idx, dir);
      window.Sfx.mood(PROJECTS[idx].mood);
    }
  }

  /* ── intro: fan out from the center ── */
  var STAGGER  = 90;    /* ms between cards, moving outward from the active one */
  var DURATION = 1100;  /* ms for each card to reach its place */

  function fanOut() {
    /* 1. start state: everything stacked at the center, low and swung to one side */
    cards.forEach(function (card, i) {
      var dir = i === active ? 0 : (i > active ? -1 : 1);
      card.classList.remove('spawn', 'floating');
      card.style.transition = 'none';
      place(card, { tx: 0, ty: 70, scale: 0.7, opacity: 0, z: layout(i).z }, dir * 16);
    });
    void container.offsetWidth;   /* commit the start state before animating */

    /* 2. spring out to the arc, staggered by distance from the active card */
    var maxDist = 0;
    cards.forEach(function (card, i) {
      var d     = Math.abs(i - active);
      var delay = d * STAGGER;
      maxDist   = Math.max(maxDist, d);
      card.style.transition =
        'transform ' + DURATION + 'ms cubic-bezier(0.34, 1.45, 0.64, 1) ' + delay + 'ms,' +
        'opacity 500ms ease ' + delay + 'ms';
      /* the picture fades up as the card lands (see home.css) */
      card.style.setProperty('--d', (delay + 350) + 'ms');
      card.classList.add('spawn');
    });
    render();

    /* 3. hand control back: restore the stylesheet transitions, reveal the title */
    later(function () {
      cards.forEach(function (card) { card.style.transition = ''; });
      container.style.pointerEvents = '';
      ready = true;
      titleEl.removeAttribute('data-shown');   /* so the title decodes as it appears */
      render();
      setInteractive(true);
      startPulse();
      if (!reduceMotion) cards.forEach(function (card) { card.classList.add('floating'); });
    }, maxDist * STAGGER + DURATION);
  }

  /* no intro animation: everything simply appears in place */
  function instant() {
    cards.forEach(function (card) { card.style.transition = 'none'; });
    ready = true;
    container.style.pointerEvents = '';
    render();
    setInteractive(true);
    void container.offsetWidth;
    cards.forEach(function (card) { card.style.transition = ''; });
  }

  /* wait for the cover images so they don't pop in halfway through the intro */
  function whenImagesReady(cb) {
    var imgs    = container.querySelectorAll('img');
    var pending = imgs.length;
    var fired   = false;
    function fire() { if (!fired) { fired = true; cb(); } }
    function one()  { if (--pending <= 0) fire(); }

    if (!pending) return fire();
    imgs.forEach(function (im) {
      if (im.complete) one();
      else { im.addEventListener('load', one); im.addEventListener('error', one); }
    });
    later(fire, 1500);   /* never wait forever on a slow image */
  }

  /* ── public: called by router.js ── */
  function enter() {
    if (running) return;
    running = true;
    sizeCards();
    if (window.Sfx) window.Sfx.mood(PROJECTS[active].mood);
    if (reduceMotion) { instant(); return; }
    whenImagesReady(function () { if (running) fanOut(); });
  }

  function leave() {
    running = false;
    ready   = false;
    clearTimers();
    setInteractive(false);
    if (stopPulse) stopPulse();
    if (titleEl) titleEl.removeAttribute('data-shown');
    container.style.pointerEvents = 'none';
    if (labelEl) labelEl.classList.remove('visible');
    huntTimers.forEach(clearTimeout); huntTimers = [];
    slateEl.classList.remove('visible'); slateEl.removeAttribute('data-shown');
    cards.forEach(function (card) { card.classList.remove('is-active', 'glitch'); });
    cards.forEach(function (card) {
      card.classList.remove('spawn', 'floating');
      card.style.transition = 'none';
      card.style.opacity = 0;
    });
  }

  window.HomeCarousel = { enter: enter, leave: leave, cardFor: cardFor, focus: focus };

  /* ── parallax: the pictures drift against their frames as the mouse moves ── */
  if (!reduceMotion) {
    var pRaf = 0, mx = 0, my = 0;
    window.addEventListener('mousemove', function (e) {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
      if (pRaf) return;
      pRaf = requestAnimationFrame(function () {
        pRaf = 0;
        container.style.setProperty('--px', (-mx * 10).toFixed(1) + 'px');
        container.style.setProperty('--py', (-my * 8).toFixed(1) + 'px');
      });
    }, { passive: true });
  }

  /* ── hover to focus ──
     Driven by real mouse movement, not by mouseenter: when the arc re-centers,
     the cards slide under a motionless cursor and the browser fires mouseenter
     again, which would make the carousel run away to the last card.
     A card only takes focus after the pointer moved at least HOVER_MOVE px
     since the last change, and no faster than one change every HOVER_GAP ms. */
  var startX = 0, down = false, moved = false;   /* drag state (used by the hover code too) */
  var HOVER_MOVE = 24, HOVER_GAP = 180;
  var lastX = null, lastT = 0;
  window.addEventListener('mousemove', function (e) {
    if (!ready || down) return;
    var el   = document.elementFromPoint(e.clientX, e.clientY);
    var card = el && el.closest ? el.closest('.c-card') : null;
    var idx  = card ? cards.indexOf(card) : -1;
    if (idx < 0 || idx === active) return;
    var now = Date.now();
    if (now - lastT < HOVER_GAP) return;
    if (lastX !== null && Math.abs(e.clientX - lastX) < HOVER_MOVE) return;
    lastX = e.clientX;
    lastT = now;
    setActive(idx);
  }, { passive: true });

  /* ── mouse wheel / trackpad: one card per gesture ── */
  var wheelAcc = 0, wheelT = 0, wheelReset = 0;
  window.addEventListener('wheel', function (e) {
    if (!ready) return;
    var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (e.deltaMode === 1) d *= 16;                       /* lines → pixels */
    wheelAcc += d;
    clearTimeout(wheelReset);
    wheelReset = setTimeout(function () { wheelAcc = 0; }, 180);
    var now = Date.now();
    if (Math.abs(wheelAcc) < 60 || now - wheelT < 260) return;   /* threshold + cooldown for trackpad inertia */
    wheelAcc > 0 ? setActive(Math.min(N - 1, active + 1)) : setActive(Math.max(0, active - 1));
    wheelAcc = 0;
    wheelT = now;
  }, { passive: true });

  /* ── drag / swipe ── */

  container.addEventListener('mousedown', function (e) {
    down = true; startX = e.clientX; moved = false;
  });
  window.addEventListener('mousemove', function (e) {
    if (down && Math.abs(e.clientX - startX) > 6) moved = true;
  });
  window.addEventListener('mouseup', function (e) {
    if (!down) return; down = false;
    if (moved) {
      var dx = e.clientX - startX;
      if (dx > 50  && active > 0)    setActive(active - 1);
      if (dx < -50 && active < N-1)  setActive(active + 1);
    }
  });

  /* touch: the arc follows the finger 1:1 while dragging (nudge it a little, it
     moves a little — no fixed threshold before anything happens), then on release
     it settles on whichever card is nearest, nudged further by how fast you let
     go — a light flick barely carries past where you left it, a hard one sends
     it several cards further, like real momentum scrolling. */
  var SWIPE_MIN   = 24;    /* px: below this on release, snap straight back (a tap, not a swipe) */
  var MOMENTUM_MS = 120;   /* how much of the release speed turns into extra reach */
  var MAX_JUMP    = 5;     /* cards; a cap so one gesture can't skip the whole list */
  var dragging = false, dragOffset = 0;
  var lastX = 0, lastT = 0, vel = 0;   /* velocity from the most recent touchmove, not the whole gesture */

  container.addEventListener('touchstart', function (e) {
    if (!ready) return;
    dragging = true; moved = false;
    startX = lastX = e.touches[0].clientX;
    lastT = Date.now();
    vel = 0; dragOffset = 0;
    cards.forEach(function (c) { c.style.transition = 'none'; });   /* 1:1 tracking, no easing lag */
  }, { passive: true });

  container.addEventListener('touchmove', function (e) {
    if (!dragging) return;
    var x = e.touches[0].clientX, t = Date.now();
    var dt = Math.max(1, t - lastT);
    vel = (x - lastX) / dt;
    lastX = x; lastT = t;
    var dx = x - startX;
    if (Math.abs(dx) > 6) moved = true;
    dragOffset = -dx / spacing();
    var pos = Math.max(0, Math.min(N - 1, active + dragOffset));
    renderDrag(pos);
  }, { passive: true });

  container.addEventListener('touchend', function (e) {
    if (!dragging) return;
    dragging = false;
    cards.forEach(function (c) { c.style.transition = ''; });   /* restore the CSS ease for the settle */
    var dx = e.changedTouches[0].clientX - startX;
    if (!moved || Math.abs(dx) < SWIPE_MIN) { render(); return; }   /* too small: spring back to the current card */
    var reach = dx + vel * MOMENTUM_MS;
    var jump  = Math.round(-reach / spacing());
    if (jump === 0) jump = dx > 0 ? -1 : 1;               /* a real swipe always moves at least one card */
    jump = Math.max(-MAX_JUMP, Math.min(MAX_JUMP, jump));
    var target = Math.max(0, Math.min(N - 1, active + jump));
    if (target === active) render(); else setActive(target);
  });

  /* ── keyboard ── */
  window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft'  && active > 0)    setActive(active - 1);
    if (e.key === 'ArrowRight' && active < N-1)  setActive(active + 1);
  });

  window.addEventListener('resize', function () { sizeCards(); if (ready) render(); });

  /* ── start hidden and inactive until enter() is called ── */
  sizeCards();
  container.style.pointerEvents = 'none';

})();
