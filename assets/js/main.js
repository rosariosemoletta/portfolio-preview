/* ═══════════════════════════════════════════════
   MAIN.JS — shared behaviors
   ═══════════════════════════════════════════════ */

/* ---- fade-in when entering the viewport ----
   The pages are rendered by router.js after load, so this is a function it
   calls every time it puts new content on screen. */
(function () {
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
  }

  window.initFadeIns = function (scope) {
    var els = (scope || document).querySelectorAll('.fade-in:not(.visible)');
    els.forEach(function (el) {
      if (io) io.observe(el);
      else el.classList.add('visible');
    });
  };
})();

document.addEventListener('DOMContentLoaded', function () {

  /* ---- nav: border/blur on scroll ---- */
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', onScroll);
    onScroll();
  }

});
