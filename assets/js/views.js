/* ═══════════════════════════════════════════════
   VIEWS.JS — the pages of the site
   Each view returns { title, html, footer, mood, glitch } and router.js puts it on screen.
     work      the projects grid with category filters (built from projects.js)
     project   one project: info on the left, free-form media on the right (media.js lays it out)
     about     the <template id="tpl-about"> in index.html
     contact   the <template id="tpl-contact"> in index.html
     notfound  the "signal lost" page for unknown addresses
   To edit the About or Contact text, change those templates in index.html.
   The behavior of the filters, the copy buttons, etc. is in fx.js.
   ═══════════════════════════════════════════════ */

(function () {
  function tpl(id) {
    var t = document.getElementById(id);
    return t ? t.innerHTML : '';
  }

  /* text that goes into an attribute or into the page, made safe */
  function esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---- WORK: filters + grid of all projects ---- */
  function work() {
    var tags = [];
    PROJECTS.forEach(function (p) { if (tags.indexOf(p.tag) < 0) tags.push(p.tag); });

    var chips =
      '<div class="filters" role="group" aria-label="Filter projects">' +
        '<button type="button" class="chip is-active" data-tag="" aria-pressed="true">All</button>' +
        tags.map(function (t) { return '<button type="button" class="chip" data-tag="' + esc(t) + '" aria-pressed="false">' + t + '</button>'; }).join('') +
      '</div>';

    var cards = PROJECTS.map(function (p) {
      /* no cover yet: a colored block with the title, so the grid still reads well */
      var media = p.cover
        ? '<img class="project-card-img" src="' + (p.coverWide || p.cover) + '" alt="' + esc(p.title) + '" loading="lazy">'
        : '<div class="project-card-img project-card-placeholder" style="background:' + (p.color || '#eee') + '">' +
            '<div class="project-card-blob" style="background:' + (p.blob || '#ccc') + '"></div>' +
            '<span class="project-card-ph-tag">' + p.tag + '</span>' +
            '<span class="project-card-ph-title">' + p.title + '</span>' +
          '</div>';

      return '<a class="project-card fade-in" href="#/project/' + p.id + '" data-tag="' + esc(p.tag) + '" data-cursor="View" ' +
               'style="background:' + (p.color || '#eee') + '">' +
               media +
               '<div class="project-card-overlay">' +
                 '<div class="project-card-info">' +
                   '<div class="project-card-tag">' + p.tag + ' — ' + p.year + '</div>' +
                   '<div class="project-card-title">' + p.title + '</div>' +
                 '</div>' +
               '</div>' +
             '</a>';
    }).join('');

    return {
      title: 'Work — Rosario Semoletta',
      html:
        '<section class="section">' +
          '<div class="section-label">Selected work</div>' +
          chips +
          '<div class="projects-grid">' + cards + '</div>' +
        '</section>'
    };
  }

  /* ---- PROJECT: info on the left, media on the right ---- */

  /* one item of the media column; media.js measures, lays out and animates them.
     Its role decides how it behaves:  final = full player with sound,  draft = muted loop / still.
     The first item is also the "main" one: the piece the card grows into (layout only). */
  function mediaItem(m, isMain, title) {
    var role    = m.role === 'final' || m.role === 'draft' ? m.role : (isMain ? 'final' : 'draft');
    var isFinal = role === 'final';
    var cls     = 'media-item' + (isMain ? ' is-main' : '') + (isFinal ? ' is-final' : '') + (m.alpha ? ' has-alpha' : '');
    var attrs   = ' data-role="' + role + '"' + (m.ratio ? ' data-ratio="' + esc(m.ratio) + '"' : '') + (m.span ? ' data-span="' + esc(m.span) + '"' : '');

    if (m.type === 'placeholder') {      /* a colored block: for sample projects */
      return '<figure class="' + cls + '" data-kind="placeholder"' + (m.ratio ? attrs : attrs + ' data-ratio="4:3"') +
               ' style="background:' + (m.color || '#eee') + '">' +
               (m.blob ? '<span class="media-blob" style="background:' + m.blob + '"></span>' : '') +
             '</figure>';
    }
    if (m.type === 'image') {
      /* sizes: the media column is about 60% of the window on a desktop, and wide items take all of it */
      var wide  = m.span === 'full' || (m.span !== 'half' && window.Media.parseRatio(m.ratio, 4 / 3) >= 1.2);
      var sizes = '(max-width: 900px) 100vw, ' + (wide ? '60vw' : '30vw');
      var img   = '<img src="' + m.src + '"' + (m.srcset ? ' srcset="' + m.srcset + '" sizes="' + sizes + '"' : '') +
                  ' alt="' + esc(m.alt || title) + '" decoding="async"' + (isMain ? '' : ' loading="lazy"') + '>';
      if (m.avif) img = '<picture><source type="image/avif" srcset="' + m.avif + '" sizes="' + sizes + '">' + img + '</picture>';
      return '<figure class="' + cls + '" data-kind="image"' + attrs + '>' + img + '</figure>';
    }
    /* video: a Vimeo / YouTube link, or a file */
    var e = window.Media.parseEmbed(m.src);
    if (e) {
      var poster = m.poster || (e.provider === 'youtube' ? 'https://i.ytimg.com/vi/' + e.id + '/hqdefault.jpg' : '');
      return '<figure class="' + cls + '" data-kind="embed" data-provider="' + e.provider + '" data-id="' + e.id + '"' + attrs + '>' +
               (isFinal ? (poster ? '<img src="' + poster + '" alt="">' : '') +
                          '<button class="media-play" type="button" aria-label="Play video">' +
                            '<span class="vp-big" aria-hidden="true"><span class="vp-big-icon">' +
                              '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>' +
                            '</span><span class="vp-big-label">Play</span></span>' +
                          '</button>' : '') +
             '</figure>';
    }
    /* a file: a draft loads nothing until it scrolls into view (media.js); with a WebM copy the lighter one goes first */
    var sources = m.webm ? '<source src="' + m.webm + '" type="video/webm"><source src="' + m.src + '" type="video/mp4">' : '';
    return '<figure class="' + cls + '" data-kind="video"' + attrs + '>' +
             '<video' + (m.webm ? '' : ' src="' + m.src + '"') + ' playsinline preload="' + (isFinal || isMain ? 'metadata' : 'none') + '"' +
               (m.poster ? ' poster="' + m.poster + '"' : '') +
               (isFinal ? ' controls' : ' muted loop aria-hidden="true" tabindex="-1"') + '>' + sources + '</video>' +
           '</figure>';
  }

  function project(route) {
    var id  = route.id;
    var idx = -1;
    PROJECTS.forEach(function (x, i) { if (x.id === id) idx = i; });
    var p = PROJECTS[idx];

    if (!p) return notfound({ what: 'project', path: '#/project/' + id });

    /* the media: what the project lists, or just its cover if it lists nothing */
    var media = (p.media && p.media.length) ? p.media : (p.cover ? [{ type: 'image', src: p.cover }] : []);
    var items = media.map(function (m, i) { return mediaItem(m, i === 0, p.title); }).join('');

    /* the info column */
    var rows = [['Year', p.year], ['Category', p.tag], ['Client', p.client], ['Tools', p.tools]]
      .filter(function (r) { return r[1]; })
      .map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; })
      .join('');
    var link = p.link
      ? '<a class="external-link" href="' + p.link + '" target="_blank" rel="noopener">View full project →</a>'
      : '';

    /* previous / next project (fx.js also binds them to ← → and to swiping) */
    var prev = PROJECTS[idx - 1], next = PROJECTS[idx + 1];
    var pnav = '<nav class="project-nav" aria-label="Project navigation">';
    pnav += prev ? '<a class="pn-prev" href="#/project/' + prev.id + '">← ' + prev.title + '</a>' : '<span></span>';
    if (next) pnav += '<a class="pn-next" href="#/project/' + next.id + '">' + next.title + ' →</a>';
    pnav += '</nav>';

    return {
      title:  p.title + ' — Rosario Semoletta',
      html:
        '<div class="project-layout">' +
          '<aside class="project-info">' +
            '<header class="pj-head fade-in">' +
              '<a class="pj-back" href="#/" data-home-card="' + p.id + '" aria-label="Back to Home">Back</a>' +
              '<h1 class="pj-title">' + p.title + '</h1>' +
            '</header>' +
            '<div class="pj-body fade-in">' +
              '<div class="pj-desc">' + p.longDesc + '</div>' +
              '<dl class="pj-meta">' + rows + '</dl>' +
              link + pnav +
            '</div>' +
          '</aside>' +
          '<div class="media-grid">' + items + '</div>' +
        '</div>',
      footer: '<a class="footer-link" href="#/work">← All work</a>',
      mood:   p.mood
    };
  }

  /* ---- NOT FOUND: an address that leads nowhere ---- */
  function notfound(route) {
    return {
      title: 'Signal lost — Rosario Semoletta',
      html:
        '<section class="lost">' +
          '<p class="lost-code glitch" data-text="404" aria-hidden="true">404</p>' +
          '<h1 class="lost-title">Signal lost.</h1>' +
          '<p class="lost-path">No ' + esc(route.what || 'page') + ' found at <span>' + esc(route.path || '') + '</span></p>' +
          '<a class="lost-back" href="#/">← Back to the start</a>' +
        '</section>',
      glitch: true
    };
  }

  window.Views = {
    work:     work,
    project:  project,
    about:    function () { return { title: 'About — Rosario Semoletta',   html: tpl('tpl-about') }; },
    contact:  function () { return { title: 'Contact — Rosario Semoletta', html: tpl('tpl-contact') }; },
    notfound: notfound
  };
})();
