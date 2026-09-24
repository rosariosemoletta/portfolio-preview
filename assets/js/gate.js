/* ═══════════════════════════════════════════════
   GATE.JS — entry screen
   One button that lets the visitor into the site.
   The click is also the user gesture browsers require before
   they allow any audio, so it starts the sound too.

   • Uses the active theme (light / dark), like the rest of the site.
   • Shown on every fresh load of the page (that is when audio is locked).
     Moving between sections never reloads the page, so it appears only once
     per visit. Add ?nogate to the URL to skip it while working on the site.
   • Enter / Space / click enters.
   • Fires "gate:done" on window when the page underneath should come alive
     (router.js starts the carousel intro on it).
   ═══════════════════════════════════════════════ */

(function () {
  var root = document.documentElement;
  var gate = document.getElementById('gate');

  window.__gateDone = false;

  function signalDone() {
    if (window.__gateDone) return;
    window.__gateDone = true;
    if (window.Sfx) window.Sfx.ambient(true);   /* the pad stays on for the whole visit */
    window.dispatchEvent(new Event('gate:done'));
  }

  /* nothing to show (?nogate, or no gate in the page) */
  if (!gate || root.classList.contains('no-gate')) {
    if (gate && gate.parentNode) gate.parentNode.removeChild(gate);
    signalDone();
    return;
  }

  /* greeting from the visitor's local time */
  var greet = document.getElementById('gate-greeting');
  if (greet) {
    var hour = new Date().getHours();
    greet.textContent = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }

  var btn     = gate.querySelector('.gate-enter');
  var entered = false;

  function enter() {
    if (entered) return;
    entered = true;

    gate.classList.add('is-leaving');
    document.removeEventListener('keydown', onKey);

    /* this is the user's gesture: unlock audio, then play the entrance sound */
    if (window.Sfx) window.Sfx.wake(function (ok) { if (ok) window.Sfx.enter(); });

    setTimeout(signalDone, 350);
    setTimeout(function () {
      if (gate.parentNode) gate.parentNode.removeChild(gate);
    }, 900);
  }

  function onKey(e) {
    /* a focused button handles its own Enter / Space */
    if ((e.key === 'Enter' || e.key === ' ') && !(e.target && e.target.tagName === 'BUTTON')) {
      e.preventDefault();
      enter();
    }
  }

  btn.addEventListener('click', enter);
  document.addEventListener('keydown', onKey);
  try { btn.focus({ preventScroll: true }); } catch (e) {}
})();
