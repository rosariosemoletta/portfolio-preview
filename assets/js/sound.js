/* ═══════════════════════════════════════════════
   SOUND.JS — cinematic synth engine (Web Audio)
   No audio files: every sound is generated here.
   Exposes window.Sfx and adds a sound on/off button to the nav.

   Sound design
   • Everything lives in D minor, so the ambient pad, the card sounds and
     the theme sweeps always sit together harmonically.
   • Voices are detuned sawtooth pairs through a lowpass filter whose cutoff
     moves (the classic analog-synth "filter sweep"), plus a sine sub.
   • Moving between sections has its own soft sounds (Sfx.section, Sfx.zoom): airy
     sweeps that stay well below the events (a transition, not a notification).
   • The small interface sounds (cards, filters, confirmations) are "zaps": short
     resonant sweeps of pitch and filter, so they read as synth gestures, not as notes.
   • A dark, long reverb and a filtered dotted echo give the space.
   • The entrance is a filter-opening chord swell + noise riser + sub impact.
   • Under the page a slow four-chord pad (Dm9 → Bbmaj7 → Gm9 → Fmaj9) drifts.
     Each project can pick a "mood" (see MOODS) that moves the pad to one chord
     and opens or closes its filter.
   • An analyser measures the real output, so the nav button and the active
     card can move with the sound (Sfx.subscribe).

   Browsers block audio until the user interacts with the page
   (click, tap or key press). Until then the nav button shows a
   "pending" pulse; the first interaction unlocks the sound.
   ═══════════════════════════════════════════════ */

(function () {
  var KEY    = 'sound';
  var EVENTS = ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'];

  var enabled = read() !== 'off';
  var ctx = null, out = null, send = null, echo = null, noise = null, analyser = null;
  var btn = null, rects = [];
  var ambientWanted = false, amb = null;
  var duckOn = false;      /* true while a video with sound is playing: the pad steps back */

  function read()   { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function running() { return !!ctx && ctx.state === 'running'; }

  /* ---- audio context (created on the first user gesture) ---- */
  function build(AC) {
    ctx = new AC();

    /* master → gentle glue compressor → speakers */
    out = ctx.createGain();
    out.gain.value = 0.85;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;  comp.knee.value = 12;  comp.ratio.value = 3;
    comp.attack.value = 0.005;   comp.release.value = 0.25;
    out.connect(comp);
    comp.connect(ctx.destination);

    /* level meter: lets the interface react to the actual sound (see meterFrame) */
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.7;
    out.connect(analyser);

    /* reverb: a synthesized hall — 4 s of noise that gets darker as it decays */
    var len = Math.floor(ctx.sampleRate * 4.2);
    var pre = Math.floor(ctx.sampleRate * 0.025);
    var ir  = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = ir.getChannelData(c), lp = 0;
      for (var i = 0; i < len; i++) {
        if (i < pre) { d[i] = 0; continue; }
        var t = (i - pre) / (len - pre);
        var x = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.4);
        lp += (x - lp) * (0.06 + 0.5 * Math.pow(1 - t, 2));
        d[i] = lp * 2.4;
      }
    }
    var conv = ctx.createConvolver();  conv.buffer = ir;
    var wet  = ctx.createGain();       wet.gain.value = 0.6;
    send = ctx.createGain();
    send.connect(conv);  conv.connect(wet);  wet.connect(out);

    /* echo: dotted delay with a darkening feedback loop, also fed into the reverb */
    echo = ctx.createGain();
    var dl  = ctx.createDelay(2);          dl.delayTime.value = 0.43;
    var fb  = ctx.createGain();            fb.gain.value = 0.38;
    var flt = ctx.createBiquadFilter();    flt.type = 'lowpass';  flt.frequency.value = 1700;
    var ew  = ctx.createGain();            ew.gain.value = 0.5;
    echo.connect(dl);  dl.connect(flt);  flt.connect(fb);  fb.connect(dl);
    flt.connect(ew);   ew.connect(out);  ew.connect(send);

    /* 2 s of white noise for risers, swishes and impacts */
    var nlen = ctx.sampleRate * 2;
    noise = ctx.createBuffer(1, nlen, ctx.sampleRate);
    var nd = noise.getChannelData(0);
    for (var j = 0; j < nlen; j++) nd[j] = Math.random() * 2 - 1;

    ctx.onstatechange = function () { sync(); applyAmbient(); };
  }

  function unlock() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) build(AC);
    if (running()) return done();
    ctx.resume().then(function () { if (running()) done(); }, function () {});
  }
  function done() {
    EVENTS.forEach(function (ev) { window.removeEventListener(ev, unlock, true); });
    sync();
    applyAmbient();
  }
  EVENTS.forEach(function (ev) { window.addEventListener(ev, unlock, true); });

  /* stop the sound when the tab is hidden, bring it back when it returns */
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) ctx.suspend();
    else if (enabled) ctx.resume();
  });

  /* ---- routing: dry to the output, plus optional sends to reverb / echo ---- */
  function bus(node, rev, dly) {
    node.connect(out);
    if (rev) { var r = ctx.createGain(); r.gain.value = rev; node.connect(r); r.connect(send); }
    if (dly) { var d = ctx.createGain(); d.gain.value = dly; node.connect(d); d.connect(echo); }
  }

  /* ---- voices ---- */

  /* the core synth voice: two detuned oscillators (+ optional sine sub an octave down)
     through a lowpass whose cutoff sweeps from o.from to o.to over o.sweep seconds.
       atk / hold / rel  amplitude envelope in seconds      vol  peak level
       q                 filter resonance                   det  detune in cents
       rev / dly         reverb / echo send                 sub  sub-oscillator level */
  function note(freq, t, o) {
    var atk = Math.max(0.003, o.atk), det = o.det == null ? 8 : o.det;
    var end = t + atk + o.hold, stop = end + o.rel + 0.05;

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';  lp.Q.value = o.q || 1;
    lp.frequency.setValueAtTime(o.from, t);
    lp.frequency.exponentialRampToValueAtTime(o.to, t + (o.sweep || atk + o.hold));

    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.vol, t + atk);
    g.gain.setValueAtTime(o.vol, end);
    g.gain.exponentialRampToValueAtTime(0.0001, end + o.rel);

    [-det, det].forEach(function (cents) {
      var os = ctx.createOscillator();
      os.type = o.type || 'sawtooth';
      os.frequency.value = freq;
      os.detune.value = cents;
      os.connect(lp);
      os.start(t);  os.stop(stop);
    });
    if (o.sub) {
      var s = ctx.createOscillator();  s.type = 'sine';  s.frequency.value = freq / 2;
      var sg = ctx.createGain();       sg.gain.value = o.sub;
      s.connect(sg);  sg.connect(g);
      s.start(t);  s.stop(stop);
    }
    lp.connect(g);
    bus(g, o.rev, o.dly);
  }

  /* a saw pair gliding from f0 to f1 while the filter moves from c0 to c1 */
  function glide(t, f0, f1, dur, c0, c1, vol, rev, dly) {
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';  lp.Q.value = 2;
    lp.frequency.setValueAtTime(c0, t);
    lp.frequency.exponentialRampToValueAtTime(c1, t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.35);
    [-9, 9].forEach(function (cents) {
      var os = ctx.createOscillator();
      os.type = 'sawtooth';
      os.detune.value = cents;
      os.frequency.setValueAtTime(f0, t);
      os.frequency.exponentialRampToValueAtTime(f1, t + dur);
      os.connect(lp);
      os.start(t);  os.stop(t + dur + 0.4);
    });
    lp.connect(g);
    bus(g, rev, dly);
  }

  /* a sci-fi "zap": a detuned saw pair whose pitch AND resonant filter both sweep,
     with a quick attack and a short decay. Because the pitch is always moving, the ear
     hears a gesture (a scan, a blip) instead of a note like a piano key. */
  function zap(t, f0, f1, dur, c0, c1, vol, rev, dly) {
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';  lp.Q.value = 9;
    lp.frequency.setValueAtTime(c0, t);
    lp.frequency.exponentialRampToValueAtTime(c1, t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.14);
    [-11, 11].forEach(function (cents) {
      var os = ctx.createOscillator();
      os.type = 'sawtooth';
      os.detune.value = cents;
      os.frequency.setValueAtTime(f0, t);
      os.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.7);
      os.connect(lp);
      os.start(t);  os.stop(t + dur + 0.2);
    });
    lp.connect(g);
    bus(g, rev, dly);
  }

  /* filtered noise sweep. peak = how far through the sweep the level tops out
     (0.4 for a swish, 0.97 for a riser that builds until the hit) */
  function sweepNoise(t, dur, f0, f1, vol, q, rev, peak) {
    var src = ctx.createBufferSource();  src.buffer = noise;  src.loop = true;
    var bp  = ctx.createBiquadFilter();  bp.type = 'bandpass';  bp.Q.value = q;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * peak);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
    src.connect(bp);  bp.connect(g);  bus(g, rev, 0);
    src.start(t, Math.random());  src.stop(t + dur + 0.1);
  }

  /* a sine that falls in pitch: the "thump" / sub drop */
  function thump(t, vol, f0, f1, dur, rev) {
    var o = ctx.createOscillator();  o.type = 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);  bus(g, rev || 0, 0);
    o.start(t);  o.stop(t + dur + 0.05);
  }

  /* cinematic impact: sub drop + dull noise thud + a low saw hit */
  function hit(t, vol) {
    thump(t, vol, 120, 30, 1.1, 0.25);

    var src = ctx.createBufferSource();  src.buffer = noise;
    var lp  = ctx.createBiquadFilter();  lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(120, t + 0.5);
    var g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.6, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    src.connect(lp);  lp.connect(g);  bus(g, 0.5, 0);
    src.start(t, Math.random());  src.stop(t + 0.6);

    note(73.42, t, { atk: 0.005, hold: 0.05, rel: 1.4, vol: vol * 0.35,
                     from: 900, to: 70, sweep: 1.2, q: 2, rev: 0.6, sub: 0.8 });
  }

  /* ---- ambient bed: a slow chord progression on detuned saws ---- */
  var CHORDS = [
    { root: 73.42, v: [174.61, 220.00, 261.63, 329.63] },   /* Dm9    */
    { root: 58.27, v: [174.61, 220.00, 293.66, 349.23] },   /* Bbmaj7 */
    { root: 49.00, v: [233.08, 293.66, 349.23, 440.00] },   /* Gm9    */
    { root: 87.31, v: [220.00, 261.63, 329.63, 392.00] }    /* Fmaj9  */
  ];
  /* mood → which chord the pad sits on, how open its filter is, how airy it is */
  var MOODS = {
    calm:  { chord: 0, cut: 1100, air: 0.02  },   /* default: the slow four-chord progression */
    warm:  { chord: 1, cut: 1500, air: 0.025 },
    tense: { chord: 2, cut: 800,  air: 0.015 },
    open:  { chord: 3, cut: 2000, air: 0.04  },
    dark:  { chord: 0, cut: 550,  air: 0.008 }
  };
  var moodName = 'calm';
  function moodOf(name) { return MOODS[name] || MOODS.calm; }

  var DUCK_LEVEL = 0.15;    /* how quiet the pad gets while a video plays */
  var AMB_LEVEL = 0.035;    /* pad volume: kept well under the card sounds */
  var CHORD_SECONDS = 16;   /* how long each chord lasts */
  var GLIDE = 1.4;          /* time constant of the glide between chords */

  function osc(type, freq, detune, dest, gain, t) {
    var o = ctx.createOscillator();  o.type = type;  o.frequency.value = freq;  o.detune.value = detune || 0;
    var g = ctx.createGain();        g.gain.value = gain;
    o.connect(g);  g.connect(dest);  o.start(t);
    return o;
  }

  function ambStart() {
    if (amb) return;
    var m = moodOf(moodName), c = CHORDS[m.chord], t = ctx.currentTime;

    /* fade in from silence over 5 s */
    var master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.linearRampToValueAtTime(AMB_LEVEL, t + 5);

    /* one filter for the whole pad; a very slow LFO breathes its cutoff */
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';  lp.frequency.value = m.cut;  lp.Q.value = 0.7;
    var lfo  = ctx.createOscillator();  lfo.frequency.value = 0.045;
    var lfoG = ctx.createGain();        lfoG.gain.value = 550;
    lfo.connect(lfoG);  lfoG.connect(lp.frequency);  lfo.start(t);

    var voices = c.v.map(function (f) {
      return [osc('sawtooth', f, -6, lp, 0.07, t), osc('sawtooth', f, 6, lp, 0.07, t)];
    });
    var sub = [osc('sine', c.root, 0, lp, 0.5, t), osc('triangle', c.root * 2, 0, lp, 0.12, t)];

    /* a faint airy layer an octave above two of the voices, straight into the reverb */
    var air = ctx.createGain();
    var airOsc = [osc('sine', c.v[1] * 2, 0, air, 0.6, t), osc('sine', c.v[3] * 2, 0, air, 0.6, t)];
    air.gain.value = m.air;
    air.connect(master);

    /* the pad goes through a "duck" gain so it can step back while a video plays */
    var duck = ctx.createGain();
    duck.gain.value = duckOn ? DUCK_LEVEL : 1;
    lp.connect(master);
    master.connect(duck);
    bus(duck, 0.8, 0.15);

    amb = { master: master, duck: duck, lfo: lfo, lp: lp, airGain: air, voices: voices, sub: sub, air: airOsc, idx: m.chord, timer: 0 };
    amb.timer = setInterval(nextChord, CHORD_SECONDS * 1000);
  }

  /* glide every voice of the pad to chord i */
  function gotoChord(a, i) {
    a.idx = i;
    var c = CHORDS[i], t = ctx.currentTime;
    a.voices.forEach(function (pair, v) {
      pair.forEach(function (o) { o.frequency.setTargetAtTime(c.v[v], t, GLIDE); });
    });
    a.sub[0].frequency.setTargetAtTime(c.root, t, GLIDE);
    a.sub[1].frequency.setTargetAtTime(c.root * 2, t, GLIDE);
    a.air[0].frequency.setTargetAtTime(c.v[1] * 2, t, GLIDE);
    a.air[1].frequency.setTargetAtTime(c.v[3] * 2, t, GLIDE);
  }

  /* only the default "calm" mood cycles through the chords; the others stay put */
  function nextChord() {
    var a = amb;
    if (!a || !running() || moodName !== 'calm') return;
    gotoChord(a, (a.idx + 1) % CHORDS.length);
  }

  function applyMood() {
    var a = amb;
    if (!a || !running()) return;
    var m = moodOf(moodName), t = ctx.currentTime;
    if (a.idx !== m.chord) gotoChord(a, m.chord);
    a.lp.frequency.setTargetAtTime(m.cut, t, 1.2);
    a.airGain.gain.setTargetAtTime(m.air, t, 1.2);
    clearInterval(a.timer);
    a.timer = setInterval(nextChord, CHORD_SECONDS * 1000);
  }

  function ambStop() {
    if (!amb) return;
    var a = amb, t = ctx.currentTime;
    amb = null;
    clearInterval(a.timer);
    a.master.gain.cancelScheduledValues(t);
    a.master.gain.setValueAtTime(Math.max(a.master.gain.value, 0.0001), t);
    a.master.gain.linearRampToValueAtTime(0.0001, t + 1.5);
    setTimeout(function () {
      var all = [a.lfo].concat(a.sub, a.air);
      a.voices.forEach(function (pair) { all = all.concat(pair); });
      all.forEach(function (n) { try { n.stop(); } catch (e) {} });
      try { a.master.disconnect(); a.duck.disconnect(); } catch (e) {}
    }, 1800);
  }
  function applyAmbient() {
    if (!ctx) return;
    if (ambientWanted && enabled && running()) ambStart();   /* no-op if already playing */
    else if (amb) ambStop();
  }

  /* ---- helpers ---- */

  /* D minor pentatonic (D F G A C): the pitch centre of each card's sweep, so it always sits with the pad */
  var SCALE = [0, 3, 5, 7, 10];
  function stabFreq(i) {
    var n = SCALE[i % 5] + 12 * Math.floor(i / 5);
    return 293.66 * Math.pow(2, n / 12);
  }

  function play(fn) {
    if (!enabled || !running()) return;
    fn();
  }

  /* calls cb(true) as soon as audio is running (call it from a user gesture), cb(false) if it can't */
  function wake(cb) {
    if (!enabled) { cb(false); return; }
    unlock();
    if (running()) { cb(true); return; }
    var n = 0;
    var iv = setInterval(function () {
      if (running())      { clearInterval(iv); cb(true); }
      else if (++n > 15)  { clearInterval(iv); cb(false); }
    }, 20);
  }

  /* ---- level meter: the interface moves with the real sound ----
     Three bands (low / mid / high), each scaled 0…1 against its own recent
     quietest and loudest moment, so it works at any volume. */
  var subs = [], raf = 0, lastFrame = 0, fdata = null, bands = [0, 0, 0];
  var agc = [{ lo: 255, hi: 0 }, { lo: 255, hi: 0 }, { lo: 255, hi: 0 }];
  var RANGES = [[0, 3], [4, 14], [15, 60]];   /* FFT bins */

  function meterFrame(now) {
    raf = requestAnimationFrame(meterFrame);
    if (now - lastFrame < 33) return;          /* ~30 fps is plenty */
    lastFrame = now;
    if (!fdata) fdata = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(fdata);

    for (var b = 0; b < 3; b++) {
      var sum = 0, n = 0;
      for (var i = RANGES[b][0]; i <= RANGES[b][1]; i++) { sum += fdata[i]; n++; }
      var v = sum / n, a = agc[b];
      a.hi = v > a.hi ? v : a.hi + (v - a.hi) * 0.01;
      a.lo = v < a.lo ? v : a.lo + (v - a.lo) * 0.01;
      bands[b] = Math.max(0, Math.min(1, (v - a.lo) / Math.max(a.hi - a.lo, 14)));
    }
    for (var k = 0; k < rects.length; k++) rects[k].style.transform = 'scaleY(' + (0.6 + 0.55 * bands[k]).toFixed(3) + ')';
    for (var s = 0; s < subs.length; s++) subs[s](bands);
  }

  function meter(on) {
    if (on && !raf && analyser) { lastFrame = 0; raf = requestAnimationFrame(meterFrame); }
    else if (!on && raf)        { cancelAnimationFrame(raf); raf = 0; }
    if (btn) {
      btn.classList.toggle('is-live', !!on);
      if (!on) rects.forEach(function (r) { r.style.transform = ''; });
    }
  }

  /* ---- public API ---- */
  window.Sfx = {
    /* a card of the carousel comes into focus (dir: 1 = moving right, -1 = left):
       a low "scan" zap whose pitch and filter sweep in the direction of travel, an airy
       trail and a soft sub thump. Each card has its own pitch centre, but it only colors
       the sweep: it never sounds like a scale. */
    tick: function (index, dir) {
      play(function () {
        var t  = ctx.currentTime;
        var f  = stabFreq(index || 0) * 0.5;        /* low and dark, around D3 */
        var up = (dir || 1) > 0;
        zap(t, up ? f * 0.7 : f * 1.7, up ? f * 1.7 : f * 0.7, 0.16,
            up ? 350 : 2600, up ? 2600 : 350, 0.06, 0.85, 0.45);
        sweepNoise(t, 0.2, up ? 1800 : 7000, up ? 7000 : 1800, 0.02, 1.4, 0.5, 0.4);
        thump(t, 0.06, 62, 40, 0.14, 0);
      });
    },

    /* theme switch: a dark, falling filter sweep + sub drop going dark;
       a bright, rising sweep with a rising zap and an airy trail going light */
    theme: function (dark) {
      play(function () {
        var t = ctx.currentTime;
        if (dark) {
          glide(t, 330, 70, 0.9, 3200, 200, 0.07, 0.8, 0.2);
          thump(t, 0.16, 90, 38, 0.6, 0.3);
          note(146.83, t + 0.05, { atk: 0.02, hold: 0.2, rel: 1.2, vol: 0.06,
                                   from: 900, to: 200, sweep: 1, q: 1.5, rev: 0.8 });
        } else {
          glide(t, 110, 660, 0.9, 250, 5200, 0.06, 0.85, 0.25);
          zap(t + 0.3, 400, 1300, 0.22, 500, 4200, 0.04, 0.9, 0.4);
          sweepNoise(t, 0.7, 1500, 8000, 0.03, 1.2, 0.7, 0.8);
        }
      });
    },

    /* the entrance: a chord swell while the filter opens, a noise riser, then a
       sub impact 1.45 s in (timed to when the cards land); the pad fades in after it */
    enter: function () {
      if (!enabled || !running()) return;
      var t = ctx.currentTime, IMPACT = 1.45;

      /* Dm9 chord, filter opening up to the moment of the hit */
      CHORDS[0].v.forEach(function (f) {
        note(f, t, { atk: 1.35, hold: 0.9, rel: 3.4, vol: 0.045, from: 260, to: 2600,
                     sweep: IMPACT, q: 1.2, rev: 0.9, dly: 0.15, det: 9 });
      });
      note(CHORDS[0].root, t, { atk: 1.4, hold: 1.0, rel: 3.6, vol: 0.07, from: 200, to: 900,
                                sweep: IMPACT, q: 1, rev: 0.5, sub: 0.9, det: 5 });

      /* building noise, cut by the hit */
      sweepNoise(t, IMPACT, 250, 6500, 0.1, 2.2, 0.5, 0.97);

      /* sub swell that lands on the impact */
      var s = ctx.createOscillator();  s.type = 'sine';  s.frequency.value = 55;
      var sg = ctx.createGain();
      sg.gain.setValueAtTime(0.0001, t);
      sg.gain.linearRampToValueAtTime(0.15, t + IMPACT);
      sg.gain.exponentialRampToValueAtTime(0.0001, t + IMPACT + 2.5);
      s.connect(sg);  sg.connect(out);
      s.start(t);  s.stop(t + IMPACT + 2.6);

      hit(t + IMPACT, 0.3);

      /* a bright, airy answer just after the hit */
      [659.25, 880].forEach(function (f, i) {
        note(f, t + IMPACT + 0.02 * i, { atk: 0.02, hold: 0.1, rel: 2.4, vol: 0.03, from: 6000,
                                         to: 1800, sweep: 1.5, q: 0.7, rev: 0.95, dly: 0.3,
                                         type: 'sine', det: 4 });
      });

      ambientWanted = true;
      applyAmbient();
    },

    /* two quick rising zaps: "done" (copied to clipboard…) */
    confirm: function () {
      play(function () {
        var t = ctx.currentTime;
        zap(t,        220, 520, 0.09, 600, 3000, 0.04, 0.7, 0.35);
        zap(t + 0.1,  330, 780, 0.09, 700, 3600, 0.04, 0.7, 0.35);
      });
    },

    /* moving to a section (Work / About / Contact / Home): a soft airy sweep and a small
       zap, each with its own character. Quiet on purpose: it is a transition, not an event. */
    section: function (name) {
      play(function () {
        var t = ctx.currentTime;
        if (name === 'work') {             /* brisk and rising */
          sweepNoise(t, 0.45, 500, 4500, 0.035, 1.6, 0.6, 0.85);
          zap(t + 0.05, 300, 800, 0.14, 350, 2800, 0.04, 0.85, 0.4);
        } else if (name === 'about') {     /* warmer, lower, slower */
          sweepNoise(t, 0.6, 300, 2200, 0.03, 1.2, 0.7, 0.8);
          zap(t + 0.08, 160, 330, 0.2, 250, 1500, 0.045, 0.9, 0.35);
        } else if (name === 'contact') {   /* open and airy: two small rising zaps */
          sweepNoise(t, 0.5, 800, 6000, 0.03, 1.4, 0.7, 0.85);
          zap(t + 0.05, 260, 600, 0.1, 500, 3200, 0.035, 0.85, 0.4);
          zap(t + 0.15, 390, 900, 0.1, 600, 3600, 0.035, 0.85, 0.4);
        } else {                           /* home: a falling sweep, like settling back */
          sweepNoise(t, 0.5, 3500, 400, 0.03, 1.4, 0.6, 0.4);
          zap(t + 0.05, 500, 200, 0.16, 2400, 350, 0.04, 0.85, 0.4);
        }
        thump(t, 0.05, 66, 40, 0.16, 0.2);
      });
    },

    /* the project "zoom" (a card growing into the project page, and back):
       dir > 0 = zooming in: an airy swell rises with the image and lands in a soft bloom
       (a fifth, long and quiet); dir < 0 = zooming out: the same swell, falling. Timed to
       the 0.6 s of the shared-element transition. */
    zoom: function (dir) {
      play(function () {
        var t = ctx.currentTime, D = 0.55;
        if (dir > 0) {
          sweepNoise(t, D, 250, 5200, 0.04, 1.8, 0.7, 0.95);
          glide(t, 90, 260, D, 200, 2400, 0.035, 0.8, 0.25);
          [[196, 0.018], [293.66, 0.014]].forEach(function (n) {
            note(n[0], t + D, { atk: 0.03, hold: 0.05, rel: 1.6, vol: n[1], from: 1800, to: 500,
                                sweep: 1.2, q: 1, rev: 0.95, dly: 0.2, det: 9, type: 'triangle' });
          });
          thump(t + D, 0.05, 80, 40, 0.5, 0.4);
        } else {
          sweepNoise(t, D, 5200, 250, 0.04, 1.8, 0.7, 0.35);
          glide(t, 260, 90, D, 2400, 200, 0.04, 0.8, 0.25);
          thump(t + D * 0.8, 0.06, 70, 38, 0.4, 0.4);
        }
      });
    },

    /* "signal lost": stuttering static, a saw falling out of tune and a low drop */
    glitch: function () {
      play(function () {
        var t = ctx.currentTime;
        for (var i = 0; i < 7; i++) {
          var at = t + i * 0.055 + Math.random() * 0.02;
          var f  = 400 + Math.random() * 5600;
          sweepNoise(at, 0.04, f, f * 0.6, 0.05, 4, 0.2, 0.5);
        }
        glide(t + 0.05, 440, 55, 0.9, 4000, 120, 0.06, 0.6, 0.3);
        thump(t + 0.35, 0.16, 100, 30, 0.7, 0.3);
      });
    },

    /* the pad's atmosphere: 'calm' | 'warm' | 'tense' | 'open' | 'dark' (projects.js: mood) */
    mood: function (name) { moodName = MOODS[name] ? name : 'calm'; applyMood(); },

    /* call fn(bands) ~30 times a second while sound is playing; bands = [low, mid, high] in 0…1.
       Returns a function that stops the calls. */
    subscribe: function (fn) {
      subs.push(fn);
      return function () { var i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); };
    },

    /* step the pad back (true) or bring it up again (false): used while a video plays */
    duck: function (on) {
      duckOn = !!on;
      if (amb) amb.duck.gain.setTargetAtTime(duckOn ? DUCK_LEVEL : 1, ctx.currentTime, 0.4);
    },

    /* start / stop the quiet pad under the page */
    ambient: function (on) { ambientWanted = !!on; applyAmbient(); },
    wake: wake,
    setEnabled: function (v) {
      enabled = !!v;
      write(enabled ? 'on' : 'off');
      sync();
      if (!enabled) { applyAmbient(); return; }
      wake(function (ok) { if (ok) { applyAmbient(); window.Sfx.tick(0, 1); } });
    }
  };

  /* ---- nav button ---- */
  function sync() {
    if (btn) {
      btn.classList.toggle('is-off', !enabled);
      btn.classList.toggle('is-pending', enabled && !running());
      btn.setAttribute('aria-pressed', String(enabled));
      btn.setAttribute('aria-label', enabled ? 'Sound on' : 'Sound off');
      btn.title = !enabled ? 'Sound off'
                : running() ? 'Sound on'
                : 'Sound on — click anywhere to enable it';
    }
    meter(enabled && running());
  }

  document.addEventListener('DOMContentLoaded', function () {
    var links = document.querySelector('.nav-links');
    if (!links) return;

    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-icon-btn sound-toggle';
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="currentColor">' +
        '<rect x="4"    y="8"  width="3" height="8"  rx="1.5"/>' +
        '<rect x="10.5" y="4"  width="3" height="16" rx="1.5"/>' +
        '<rect x="17"   y="6.5" width="3" height="11" rx="1.5"/>' +
      '</svg>';

    rects = [].slice.call(btn.querySelectorAll('rect'));
    btn.addEventListener('click', function () { window.Sfx.setEnabled(!enabled); });

    sync();
    links.appendChild(btn);
  });
})();
