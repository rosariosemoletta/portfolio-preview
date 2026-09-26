/* ═══════════════════════════════════════════════
   PLAYER.JS — the custom controls of a project's main video

   Replaces the browser's own controls (different in every browser, and out of
   place here) with a small "edit monitor" in the site's language:
     • a timeline like an editing app: a thin track with quarter ticks, a playhead
       (the vertical line of After Effects / Premiere), and a timecode readout on
       hover — all timecodes are MM:SS:FF at 24 fps, like the footer's TC
     • play / pause, sound on / off (the nav's three bars, flattened when muted),
       full screen (four corner brackets, the site's focus brackets)
     • a centered PLAY tag before the first play, when paused, and REPLAY at the end
     • the controls fade away while the video plays and come back on any movement

   Keys (with the player focused): space / K play-pause, ← → ±5 s (they no longer
   jump to the previous / next project while you are inside the player), M sound, F full screen.
   A plain <video> stays underneath: media.js still ducks the pad while it plays.
   If this file is missing, the video simply keeps the browser's controls.
   ═══════════════════════════════════════════════ */

(function () {
  var FPS = 24;
  var HIDE_MS = 2200;
  var SEEK_S = 5;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  /* HH:MM:SS:FF, the same full SMPTE form as the footer (a shorter MM:SS:FF reads like hours:minutes) */
  function tc(s) {
    s = Math.max(0, s || 0);
    var t = Math.floor(s), f = Math.min(FPS - 1, Math.floor((s - t) * FPS));
    return pad(Math.floor(t / 3600)) + ':' + pad(Math.floor(t / 60) % 60) + ':' + pad(t % 60) + ':' + pad(f);
  }

  var ICON = {
    play:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/></svg>',
    /* the same three bars as the nav's sound button */
    sound: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><rect class="vp-b" x="4" y="8" width="3" height="8" rx="1.5"/><rect class="vp-b" x="10.5" y="4" width="3" height="16" rx="1.5"/><rect class="vp-b" x="17" y="6.5" width="3" height="11" rx="1.5"/>' +
           '<path class="vp-x" d="M3 21L21 3" stroke="currentColor" stroke-width="1.8"/></svg>',
    /* four corner brackets: out = go full screen, in = leave it */
    fsIn:  '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>',
    fsOut: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/></svg>'
  };

  function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }

  function attach(fig) {
    var v = fig.querySelector('video');
    if (!v) return null;
    v.controls = false;
    v.removeAttribute('controls');

    fig.classList.add('vp');
    fig.tabIndex = 0;
    fig.setAttribute('role', 'group');
    fig.setAttribute('aria-label', 'Video player');

    fig.insertAdjacentHTML('beforeend',
      '<div class="vp-surface"></div>' +
      '<i class="vp-br vp-br-tl"></i><i class="vp-br vp-br-tr"></i><i class="vp-br vp-br-bl"></i><i class="vp-br vp-br-br"></i>' +
      '<button class="vp-big" type="button" aria-label="Play">' +
        '<span class="vp-big-icon">' + ICON.play + '</span>' +
        '<span class="vp-big-label">Play</span>' +
        '<span class="vp-big-dur"></span>' +
      '</button>' +
      '<div class="vp-bar">' +
        '<div class="vp-track" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0">' +
          '<div class="vp-line"><div class="vp-buf"></div><div class="vp-fill"></div></div>' +
          '<i class="vp-tick" style="left:25%"></i><i class="vp-tick" style="left:50%"></i><i class="vp-tick" style="left:75%"></i>' +
          '<div class="vp-head"></div>' +
          '<div class="vp-hover"><span></span></div>' +
        '</div>' +
        '<div class="vp-row">' +
          '<button class="vp-btn vp-play" type="button" aria-label="Play">' + ICON.play + '</button>' +
          '<span class="vp-tc"><span class="vp-tc-label">TC</span> <span class="vp-cur">00:00:00:00</span><span class="vp-dur"> / 00:00:00:00</span></span>' +
          '<span class="vp-spacer"></span>' +
          '<button class="vp-btn vp-mute" type="button" aria-label="Sound off" aria-pressed="false">' + ICON.sound + '</button>' +
          '<button class="vp-btn vp-fs" type="button" aria-label="Full screen">' + ICON.fsIn + '</button>' +
        '</div>' +
      '</div>');

    var $ = function (sel) { return fig.querySelector(sel); };
    var surface = $('.vp-surface'), big = $('.vp-big'), bigLabel = $('.vp-big-label'), bigDur = $('.vp-big-dur');
    var bigIcon = $('.vp-big-icon'), bar = $('.vp-bar'), track = $('.vp-track');
    var fill = $('.vp-fill'), buf = $('.vp-buf'), head = $('.vp-head');
    var hover = $('.vp-hover'), hoverTc = $('.vp-hover span');
    var playBtn = $('.vp-play'), curEl = $('.vp-cur'), durEl = $('.vp-dur');
    var muteBtn = $('.vp-mute'), fsBtn = $('.vp-fs');

    var raf = 0, hideT = 0, scrubbing = false, resumeAfterScrub = false, lastTc = '', alive = true;

    function dur() { return isFinite(v.duration) ? v.duration : 0; }

    /* ---- drawing ---- */
    function drawTime() {
      var d = dur(), t = v.currentTime, p = d ? Math.min(1, t / d) : 0;
      fill.style.transform = 'scaleX(' + p + ')';
      head.style.left = (p * 100) + '%';
      var s = tc(t);
      if (s !== lastTc) {
        lastTc = s;
        curEl.textContent = s;
        track.setAttribute('aria-valuenow', Math.round(t));
        track.setAttribute('aria-valuetext', s + ' of ' + tc(d));
      }
    }
    function drawBuffered() {
      var d = dur(), end = 0;
      for (var i = 0; i < v.buffered.length; i++) {
        if (v.buffered.start(i) <= v.currentTime + 0.5) end = Math.max(end, v.buffered.end(i));
      }
      buf.style.transform = 'scaleX(' + (d ? Math.min(1, end / d) : 0) + ')';
    }
    function drawDuration() {
      var d = dur(), s = tc(d);
      durEl.textContent = ' / ' + s;
      bigDur.textContent = d ? s : '';
      track.setAttribute('aria-valuemax', Math.round(d));
      drawTime();
    }
    function drawState() {
      var playing = !v.paused && !v.ended;
      fig.classList.toggle('vp-playing', playing);
      fig.classList.toggle('vp-ended', v.ended);
      playBtn.innerHTML = playing ? ICON.pause : ICON.play;
      playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      bigLabel.textContent = v.ended ? 'Replay' : 'Play';
      big.setAttribute('aria-label', v.ended ? 'Replay' : 'Play');
      bigIcon.innerHTML = v.ended
        ? '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12a7 7 0 1 0 2.1-5"/><path d="M5 4v4h4"/></svg>'
        : ICON.play;
      if (playing) { startLoop(); nudge(); } else { stopLoop(); show(); }
    }
    function drawMute() {
      fig.classList.toggle('vp-muted', v.muted);
      muteBtn.setAttribute('aria-pressed', String(v.muted));
      muteBtn.setAttribute('aria-label', v.muted ? 'Sound on' : 'Sound off');
    }

    /* smooth playhead and frame-accurate timecode while playing (timeupdate is only ~4 per second) */
    function loop() { raf = requestAnimationFrame(loop); drawTime(); }
    function startLoop() { if (!raf) raf = requestAnimationFrame(loop); }
    function stopLoop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } drawTime(); }

    /* ---- showing / hiding the controls ---- */
    function show() { fig.classList.add('ui-on'); clearTimeout(hideT); }
    function nudge() {
      show();
      if (v.paused || v.ended) return;
      hideT = setTimeout(function () {
        if (scrubbing || bar.matches(':hover') || bar.contains(document.activeElement)) return nudge();
        fig.classList.remove('ui-on');
      }, HIDE_MS);
    }

    /* ---- actions ---- */
    function toggle() {
      if (v.paused || v.ended) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    }
    function seekTo(t) {
      var d = dur();
      if (!d) return;
      v.currentTime = Math.max(0, Math.min(d, t));
      drawTime(); drawBuffered();
    }
    function toggleMute() { v.muted = !v.muted; nudge(); }
    function toggleFs() {
      if (fsElement()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      if (fig.requestFullscreen) fig.requestFullscreen().catch(function () {});
      else if (fig.webkitRequestFullscreen) fig.webkitRequestFullscreen();
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();   /* iPhone: only the video itself can go full screen */
    }
    function onFsChange() {
      var on = fsElement() === fig;
      fig.classList.toggle('vp-fs', on);
      fsBtn.innerHTML = on ? ICON.fsOut : ICON.fsIn;
      fsBtn.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
      nudge();
    }

    /* ---- video events ---- */
    v.addEventListener('loadedmetadata', drawDuration);
    v.addEventListener('durationchange', drawDuration);
    v.addEventListener('play',  drawState);
    v.addEventListener('pause', drawState);
    v.addEventListener('ended', drawState);
    v.addEventListener('timeupdate', function () { if (!raf) drawTime(); drawBuffered(); });
    v.addEventListener('progress', drawBuffered);
    v.addEventListener('volumechange', drawMute);
    v.addEventListener('waiting', function () { fig.classList.add('vp-waiting'); });
    ['playing', 'canplay', 'pause', 'seeked'].forEach(function (ev) {
      v.addEventListener(ev, function () { fig.classList.remove('vp-waiting'); });
    });
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);

    /* ---- pointer ---- */
    fig.addEventListener('pointermove', function () { nudge(); });
    fig.addEventListener('pointerleave', function () { if (!v.paused && !scrubbing) { clearTimeout(hideT); fig.classList.remove('ui-on'); } });
    surface.addEventListener('click', function (e) {
      /* on a touch screen, the first tap on a playing video only brings the controls back */
      if (e.pointerType === 'touch' && !v.paused && !fig.classList.contains('ui-on')) { nudge(); return; }
      toggle();
    });
    surface.addEventListener('dblclick', toggleFs);
    big.addEventListener('click', function () { if (v.ended) v.currentTime = 0; toggle(); });
    playBtn.addEventListener('click', toggle);
    muteBtn.addEventListener('click', toggleMute);
    fsBtn.addEventListener('click', toggleFs);

    /* the timeline: click or drag to seek, hover to read the time under the pointer */
    function ratioAt(e) {
      var r = track.getBoundingClientRect();
      return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    }
    function showHover(e) {
      var p = ratioAt(e);
      hover.style.left = (p * 100) + '%';
      hoverTc.textContent = tc(p * dur());
    }
    track.addEventListener('pointerdown', function (e) {
      if (!dur()) return;
      scrubbing = true;
      fig.classList.add('vp-scrub');
      resumeAfterScrub = !v.paused && !v.ended;
      if (resumeAfterScrub) v.pause();
      try { track.setPointerCapture(e.pointerId); } catch (err) {}
      seekTo(ratioAt(e) * dur());
      showHover(e);
    });
    track.addEventListener('pointermove', function (e) {
      showHover(e);
      if (scrubbing) seekTo(ratioAt(e) * dur());
    });
    function endScrub() {
      if (!scrubbing) return;
      scrubbing = false;
      fig.classList.remove('vp-scrub');
      if (resumeAfterScrub) toggle();
      nudge();
    }
    track.addEventListener('pointerup', endScrub);
    track.addEventListener('pointercancel', endScrub);

    /* a swipe on the controls must not count as "swipe to the next project" (fx.js listens on the page) */
    [bar, big].forEach(function (el) {
      el.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });
      el.addEventListener('touchend',   function (e) { e.stopPropagation(); }, { passive: true });
    });

    /* ---- keyboard ---- */
    fig.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var k = e.key, onButton = e.target.tagName === 'BUTTON';
      if ((k === ' ' || k === 'Enter') && onButton) return;          /* a focused button handles its own press */
      var done = true;
      if (k === ' ' || k === 'k' || k === 'K') toggle();
      else if (k === 'ArrowLeft')  seekTo(v.currentTime - SEEK_S);
      else if (k === 'ArrowRight') seekTo(v.currentTime + SEEK_S);
      else if (k === 'Home' && e.target === track) seekTo(0);
      else if (k === 'End'  && e.target === track) seekTo(dur());
      else if (k === 'm' || k === 'M') toggleMute();
      else if (k === 'f' || k === 'F') toggleFs();
      else done = false;
      if (done) { e.preventDefault(); e.stopPropagation(); nudge(); }   /* ← → stay here, not "next project" */
    });
    fig.addEventListener('focusin', nudge);

    if (v.readyState >= 1) drawDuration();
    drawMute(); drawState(); drawBuffered();

    return {
      destroy: function () {
        if (!alive) return;
        alive = false;
        stopLoop();
        clearTimeout(hideT);
        document.removeEventListener('fullscreenchange', onFsChange);
        document.removeEventListener('webkitfullscreenchange', onFsChange);
        if (fsElement() === fig) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      }
    };
  }

  window.Player = { attach: attach };
})();
