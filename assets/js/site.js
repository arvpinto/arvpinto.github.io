/* Home page behaviour:
   0. light and dark mode,
   1. the moving water under the hero artwork, and the lamp flicker,
   2. the energy profile of each series, with a light travelling along it,
   3. the height of the two lists in the About section, and the footer clock,
   4. the e-mail link,
   5. search, filters and paging of the catalogue cards.
   Each part is independent and the page works without any of them. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(id) { return document.getElementById(id); }
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
  function isLight() { return document.documentElement.getAttribute('data-theme') === 'light'; }

  /* ------------------------------------------------------------------
     0. Light and dark mode.
     The page starts dark unless light mode was chosen before in this
     browser (an inline script in <head> applies that choice before the
     page is drawn). Images with a data-light-src (and data-light-srcset)
     attribute are switched to their light version, and a "themechange"
     event lets the animations below redraw themselves.
  ------------------------------------------------------------------ */
  (function theme() {
    var button = $('theme-toggle');
    var meta = document.querySelector('meta[name="theme-color"]');

    function swapImages(light) {
      each('img[data-light-src]', function (im) {
        if (!im.dataset.darkSrc) {
          im.dataset.darkSrc = im.getAttribute('src');
          im.dataset.darkSrcset = im.getAttribute('srcset') || '';
        }
        var srcset = light ? (im.dataset.lightSrcset || '') : im.dataset.darkSrcset;
        if (srcset) im.setAttribute('srcset', srcset); else im.removeAttribute('srcset');
        im.setAttribute('src', light ? im.dataset.lightSrc : im.dataset.darkSrc);
        im.classList.toggle('is-light', light);
      });
    }

    function apply(light, announce) {
      if (light) document.documentElement.setAttribute('data-theme', 'light');
      else document.documentElement.removeAttribute('data-theme');
      swapImages(light);
      if (meta) meta.setAttribute('content', light ? '#ffffff' : '#000000');
      if (button) {
        button.setAttribute('aria-pressed', String(light));
        button.setAttribute('title', light ? 'Switch to dark mode' : 'Switch to light mode');
      }
      if (announce) document.dispatchEvent(new CustomEvent('themechange', { detail: { light: light } }));
    }

    if (isLight()) apply(true, false);
    if (!button) return;
    button.addEventListener('click', function () {
      var light = !isLight();
      try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (e) {}
      apply(light, true);
    });
  })();

  /* ------------------------------------------------------------------
     1. Hero water.
     The lower part of the artwork is a reflection on water. A canvas laid
     over that part redraws it row by row, each row shifted sideways by a
     travelling wave, so the reflection ripples. Rows near the bottom are
     closer to the viewer: their waves are longer and move more.
     It stops while the hero is off screen or the tab is hidden, and it
     does not run at all with "reduce motion" or data saver switched on.
  ------------------------------------------------------------------ */
  (function water() {
    var art = $('hero-art');
    if (!art || reduceMotion) return;
    if (navigator.connection && navigator.connection.saveData) return;

    var img = art.querySelector('img');
    var canvas = art.querySelector('canvas');
    if (!img || !canvas || !canvas.getContext) return;

    var WATERLINE = 0.515; // where the water starts, as a fraction of the artwork height
    var FPS = 30;
    art.style.setProperty('--waterline', (WATERLINE * 100) + '%');

    var ctx = canvas.getContext('2d');
    var still = document.createElement('canvas'); // the water as painted, at canvas resolution
    var stillCtx = still.getContext('2d');
    var W = 0, H = 0, raf = 0, last = 0;
    var onScreen = true, started = false, switching = false;

    // The artwork is loaded a second time (from the cache) without srcset, so
    // that its pixel size is the size of the file in every browser.
    var source = new Image();

    function measure() {
      var box = art.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.round(box.width * dpr);
      var h = Math.round(box.height * dpr * (1 - WATERLINE));
      if (!w || !h || !source.naturalWidth) return false;
      if (w !== W || h !== H) {
        W = w; H = h;
        canvas.width = still.width = W;
        canvas.height = still.height = H;
        // Resizing a canvas resets its settings, so they are set again here.
        stillCtx.imageSmoothingEnabled = ctx.imageSmoothingEnabled = true;
        stillCtx.imageSmoothingQuality = ctx.imageSmoothingQuality = 'high';
        var top = source.naturalHeight * WATERLINE;
        stillCtx.drawImage(source, 0, top, source.naturalWidth, source.naturalHeight - top, 0, 0, W, H);
      }
      return true;
    }

    function draw(now) {
      raf = requestAnimationFrame(draw);
      if (now - last < 1000 / FPS) return;
      last = now;
      if (switching) return;
      if (!W && !measure()) return;

      var t = now / 1000;
      var slice = Math.max(1, Math.round(W / 900)); // rows are drawn in thin slices
      ctx.clearRect(0, 0, W, H);
      for (var y = 0; y < H; y += slice) {
        var d = y / H;                         // 0 at the waterline, 1 at the bottom edge
        var calm = Math.min(1, d * 7);         // nothing moves right at the waterline
        var phase = 17 * Math.log(d + 0.055);  // waves get longer towards the viewer
        var dx = calm * W * (0.0018 + 0.0062 * d) *
                 (Math.sin(phase - t * 1.25) + 0.5 * Math.sin(phase * 2.3 + t * 0.85 + 1.7));
        var dy = calm * H * 0.007 * (0.3 + d) * Math.sin(phase * 1.4 - t * 1.05);
        var sy = Math.min(H - slice, Math.max(0, y + dy));
        ctx.drawImage(still, 0, sy, W, slice, dx, y, W, slice);
      }
      if (!started) { started = true; canvas.classList.add('is-live'); }
    }

    function play() { if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(draw); }
    function pause() { cancelAnimationFrame(raf); raf = 0; }

    function begin() {
      if (!measure()) return;
      // Let the opening sequence (the lamp switching on) finish first.
      setTimeout(play, 1300);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen) play(); else pause();
      }).observe(art);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause(); else if (started) play();
    });
    window.addEventListener('resize', function () { W = 0; });
    source.addEventListener('load', function () {
      W = 0;
      if (switching) { switching = false; return; } // the next frame redraws the new water
      if (!started) begin();
    });
    // Light and dark mode use different artwork: hide the water until the new one is in.
    document.addEventListener('themechange', function () {
      switching = true;
      started = false;
      canvas.classList.remove('is-live');
    });
    function pick() {
      var url = img.currentSrc || img.src;
      if (url && source.src !== url) source.src = url;
    }
    // A different file may be picked from srcset after a resize.
    img.addEventListener('load', pick);
    if (img.complete) pick();
  })();

  /* ------------------------------------------------------------------
     1b. Lamp flicker: every 10 to 24 seconds the lamp in the artwork
     stutters for two or three seconds (see .flicker-short and .flicker-long in
     the stylesheet). Short stutters are more common than long ones. It
     waits while the hero is off screen or the tab is hidden. Pointing at
     the lamp (or tapping it) makes it flicker straight away, at most once
     every COOLDOWN milliseconds.
  ------------------------------------------------------------------ */
  (function flicker() {
    var art = $('hero-art');
    if (!art || reduceMotion) return;
    var MIN = 10000, SPREAD = 14000, FIRST = 6000, COOLDOWN = 2800;
    var timer = 0, onScreen = true, last = 0;

    function wait(ms) { clearTimeout(timer); timer = setTimeout(stutter, ms); }
    function play(kind) {
      last = Date.now();
      art.classList.remove('flicker-short', 'flicker-long');
      void art.offsetWidth; // restart the animation if the class was still set
      art.classList.add(kind);
    }
    function stutter() {
      if (document.hidden || !onScreen) { wait(3000); return; }
      play(Math.random() < 0.7 ? 'flicker-short' : 'flicker-long');
      wait(MIN + Math.random() * SPREAD);
    }

    var spot = art.querySelector('.lamp-spot');
    if (spot) {
      var poke = function () {
        if (Date.now() - last < COOLDOWN) return;
        play(Math.random() < 0.5 ? 'flicker-short' : 'flicker-long');
        wait(MIN + Math.random() * SPREAD); // the next unprompted flicker starts counting again
      };
      spot.addEventListener('pointerenter', poke);
      spot.addEventListener('pointerdown', poke);
    }
    art.addEventListener('animationend', function (e) {
      if (e.target === art) art.classList.remove('flicker-short', 'flicker-long');
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { onScreen = entries[0].isIntersecting; }).observe(art);
    }
    // The first stutter comes a few seconds after the lamp has switched on.
    wait(FIRST + Math.random() * 6000);
  })();

  /* ------------------------------------------------------------------
     2. Series: a reaction energy profile with one lamp per step.
     A pulse of light travels along the curve in a loop. It moves like a
     particle crossing the barrier: its speed follows the energy left over,
     so it slows down towards the top and speeds up on the way down. Each
     lamp flares as the pulse goes by and then fades, and so does the title
     of its step, like street lights passing one after the other.
  ------------------------------------------------------------------ */
  (function seriesPlots() {
    var SVG = 'http://www.w3.org/2000/svg';
    var TRAVEL = 5.6;    // seconds from one end of the curve to the other
    var REST = 1.1;      // seconds of darkness before the next pass
    var AFTERGLOW = 0.8; // seconds a lamp takes to fade once the pulse has gone
    var FADE_IN = 0.06;  // part of the curve over which the pulse appears
    var FADE_OUT = 0.3;  // part of the curve over which it dissolves at the end
    var NEON = [[0, [64, 212, 255]], [0.5, [255, 60, 130]], [1, [64, 212, 255]]];
    // Colours that depend on light or dark mode: the step titles go from DIM
    // to LIT as the pulse passes; HOT is the white-hot centre of the pulse
    // (in light mode the pulse keeps its own colour instead).
    function tones() {
      return isLight()
        ? { dim: [76, 85, 99], lit: [18, 22, 28], hot: null, lampDim: [107, 115, 128] }
        : { dim: [158, 167, 180], lit: [255, 255, 255], hot: '#ffffff', lampDim: [124, 133, 146] };
    }

    function energy(t) {
      var s = t * t * (3 - 2 * t);
      return 0.3 - 0.17 * s + 0.66 * Math.exp(-Math.pow((t - 0.5) / 0.19, 2));
    }
    var E_TOTAL = energy(0.5) + 0.06; // just enough energy to get over the barrier
    function speed(t) { return Math.sqrt(E_TOTAL - energy(t)); }
    var V_MAX = speed(1);

    // Time needed to reach each point of the curve, as a fraction of the trip.
    var STEPS = 400, clock = [0];
    (function () {
      for (var i = 1; i <= STEPS; i++) clock.push(clock[i - 1] + 1 / speed((i - 0.5) / STEPS));
      for (var k = 0; k <= STEPS; k++) clock[k] /= clock[STEPS];
    })();
    function positionAt(fraction) {
      var lo = 0, hi = STEPS;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (clock[mid] <= fraction) lo = mid; else hi = mid; }
      return (lo + (fraction - clock[lo]) / (clock[hi] - clock[lo])) / STEPS;
    }

    function colourAt(t) {
      var a = NEON[0], b = NEON[NEON.length - 1];
      for (var i = 1; i < NEON.length; i++) { if (t <= NEON[i][0]) { a = NEON[i - 1]; b = NEON[i]; break; } }
      var f = b[0] === a[0] ? 0 : (t - a[0]) / (b[0] - a[0]);
      return [0, 1, 2].map(function (c) { return Math.round(a[1][c] + (b[1][c] - a[1][c]) * f); });
    }
    function ease(v) { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); }
    function rgb(c, alpha) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (alpha === undefined ? 1 : alpha) + ')'; }
    function mix(a, b, f) { return [0, 1, 2].map(function (c) { return Math.round(a[c] + (b[c] - a[c]) * f); }); }

    function el(name, attrs, parent) {
      var node = document.createElementNS(SVG, name);
      for (var k in attrs) node.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(node);
      return node;
    }

    function setup(plot, index) {
      var n = parseInt(plot.dataset.steps, 10);
      if (!n) return;
      var section = plot.parentNode;
      var titles = Array.prototype.slice.call(section.querySelectorAll('.series-steps li'));
      var view = null;      // what build() created
      var glow = [];        // current brightness of each lamp, 0 to 1
      var raf = 0, started = 0, previous = 0, onScreen = false, width = 0;
      for (var g = 0; g < n; g++) glow.push(0);

      var tone = tones();

      function build() {
        var w = plot.clientWidth, h = plot.clientHeight;
        if (!w || !h) return;
        tone = tones();
        width = w;
        var top = 16, bottom = h * 0.74;
        var lo = energy(1), hi = energy(0.5);
        function yAt(t) { return top + (hi - energy(t)) / (hi - lo) * (bottom - top); }

        var id = 'series-' + index + '-';
        var svg = el('svg', { viewBox: '0 0 ' + w + ' ' + h, focusable: 'false' });
        var defs = el('defs', {}, svg);
        var grad = el('linearGradient', { id: id + 'neon', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: w, y2: 0 }, defs);
        NEON.forEach(function (stop) { el('stop', { offset: stop[0], 'stop-color': rgb(stop[1]) }, grad); });
        [['soft', 4], ['wide', 9]].forEach(function (f) {
          var filter = el('filter', { id: id + f[0], filterUnits: 'userSpaceOnUse', x: -60, y: -60, width: w + 120, height: h + 120 }, defs);
          el('feGaussianBlur', { stdDeviation: f[1] }, filter);
        });

        // The curve as a list of points, with the length travelled up to each one.
        var N = 160, d = '', xs = [], ys = [], along = [0];
        for (var i = 0; i <= N; i++) {
          var t = i / N;
          xs.push(t * w); ys.push(yAt(t));
          d += (i ? 'L' : 'M') + xs[i].toFixed(1) + ' ' + ys[i].toFixed(1);
          if (i) along.push(along[i - 1] + Math.sqrt(Math.pow(xs[i] - xs[i - 1], 2) + Math.pow(ys[i] - ys[i - 1], 2)));
        }
        var total = along[N];
        var stroke = 'url(#' + id + 'neon)';

        // The unlit tube.
        el('path', { d: d, fill: 'none', stroke: stroke, 'stroke-width': 5, opacity: 0.22, filter: 'url(#' + id + 'soft)' }, svg);
        el('path', { d: d, fill: 'none', stroke: stroke, 'stroke-width': 1.6, opacity: 0.42, 'stroke-linecap': 'round' }, svg);

        // Lamps: a post, a halo that lights up, a ring and a bright core.
        var lamps = [];
        for (var k = 0; k < n; k++) {
          var at = (k + 0.5) / n, c = colourAt(at), x = at * w, y = yAt(at);
          lamps.push({
            at: at,
            colour: c,
            post: el('line', { x1: x, x2: x, y1: y + 8, y2: h, stroke: rgb(c), 'stroke-width': 1, 'stroke-dasharray': '2 5' }, svg),
            halo: el('circle', { cx: x, cy: y, r: 15, fill: rgb(c), filter: 'url(#' + id + 'wide)' }, svg),
            ring: el('circle', { cx: x, cy: y, r: 5.5, fill: isLight() ? '#ffffff' : '#000000', stroke: rgb(c), 'stroke-width': 1.8 }, svg),
            core: el('circle', { cx: x, cy: y, r: 3, fill: tone.hot || rgb(c) }, svg)
          });
        }

        // The pulse: a blurred streak, a coloured streak, a white-hot centre and a head.
        var streaks = [
          { part: 1.6, node: el('path', { d: d, fill: 'none', stroke: stroke, 'stroke-width': 9, 'stroke-linecap': 'round', filter: 'url(#' + id + 'soft)' }, svg) },
          { part: 1.0, node: el('path', { d: d, fill: 'none', stroke: stroke, 'stroke-width': 3, 'stroke-linecap': 'round' }, svg) },
          { part: 0.45, node: el('path', { d: d, fill: 'none', stroke: tone.hot || stroke, 'stroke-width': 1.3, 'stroke-linecap': 'round' }, svg) }
        ];
        var headHalo = el('circle', { r: 11, filter: 'url(#' + id + 'soft)' }, svg);
        var head = el('circle', { r: 3.2, fill: tone.hot || '#ffffff', stroke: tone.hot ? 'none' : stroke, 'stroke-width': 1.6 }, svg);

        plot.textContent = '';
        plot.appendChild(svg);
        view = { xs: xs, ys: ys, along: along, total: total, N: N, lamps: lamps, streaks: streaks, head: head, headHalo: headHalo };
      }

      // Draws one moment: `at` is the position of the pulse (0 to 1), or -1 when it is away.
      function paint(at, fade) {
        if (!view) return;
        var on = at >= 0;
        var visible = on ? String(fade) : '0';

        if (on) {
          var f = at * view.N, i = Math.min(view.N - 1, Math.floor(f)), r = f - i;
          var x = view.xs[i] + (view.xs[i + 1] - view.xs[i]) * r;
          var y = view.ys[i] + (view.ys[i + 1] - view.ys[i]) * r;
          var done = view.along[i] + (view.along[i + 1] - view.along[i]) * r;
          // The streak is longer when the pulse is fast.
          var length = view.total * (0.035 + 0.15 * speed(at) / V_MAX) * (0.35 + 0.65 * fade);
          view.streaks.forEach(function (s) {
            var part = length * s.part;
            s.node.setAttribute('stroke-dasharray', part.toFixed(1) + ' ' + (view.total * 3).toFixed(1));
            s.node.setAttribute('stroke-dashoffset', (part - done).toFixed(1));
          });
          view.head.setAttribute('cx', x); view.head.setAttribute('cy', y);
          view.headHalo.setAttribute('cx', x); view.headHalo.setAttribute('cy', y);
          view.headHalo.setAttribute('fill', rgb(colourAt(at)));
        }
        view.streaks.forEach(function (s) { s.node.setAttribute('opacity', visible); });
        view.head.setAttribute('opacity', visible);
        view.headHalo.setAttribute('opacity', on ? String(0.9 * fade) : '0');

        view.lamps.forEach(function (lamp, k) {
          var b = glow[k];
          lamp.halo.setAttribute('opacity', (0.95 * b).toFixed(3));
          lamp.core.setAttribute('opacity', b.toFixed(3));
          lamp.ring.setAttribute('stroke-opacity', (0.4 + 0.6 * b).toFixed(3));
          lamp.post.setAttribute('opacity', (0.22 + 0.7 * b).toFixed(3));
          var title = titles[k];
          if (!title) return;
          var link = title.querySelector('a');
          title.style.setProperty('--lamp', rgb(mix(tone.lampDim, lamp.colour, b)));
          if (link) {
            link.style.color = rgb(mix(tone.dim, tone.lit, Math.min(1, b * 1.2)));
            link.style.textShadow = b > 0.02 ? '0 0 ' + (14 * b).toFixed(1) + 'px ' + rgb(lamp.colour, (0.85 * b).toFixed(2)) : 'none';
          }
        });
      }

      function frame(now) {
        raf = requestAnimationFrame(frame);
        if (!started) { started = previous = now; }
        var dt = Math.min(0.1, (now - previous) / 1000);
        previous = now;

        var t = ((now - started) / 1000) % (TRAVEL + REST);
        var at = t < TRAVEL ? positionAt(t / TRAVEL) : -1;
        // The pulse comes up quickly at the start and dissolves slowly over the
        // last stretch of the curve, instead of being cut off at the edge.
        var fade = at < 0 ? 0 : ease(at / FADE_IN) * ease((1 - at) / FADE_OUT);
        var decay = Math.exp(-dt / AFTERGLOW);
        for (var k = 0; k < n; k++) {
          var near = at < 0 ? 0 : Math.exp(-Math.pow((at - (k + 0.5) / n) * n / 0.36, 2));
          glow[k] = Math.max(near, glow[k] * decay);
        }
        paint(at, fade);
      }

      function play() { if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(frame); }
      function pause() { cancelAnimationFrame(raf); raf = 0; previous = 0; started = 0; }

      plot.classList.add('is-ready');
      build();
      document.addEventListener('themechange', function () { build(); if (!raf) rest(); });
      window.addEventListener('resize', function () {
        if (plot.clientWidth && plot.clientWidth !== width) { build(); if (!raf) rest(); }
      });

      // Without animation every lamp is simply left half lit.
      function rest() {
        for (var k = 0; k < n; k++) glow[k] = reduceMotion ? 0.55 : 0;
        paint(-1, 0);
      }
      rest();
      if (reduceMotion || !('IntersectionObserver' in window)) return;

      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen) play(); else pause();
      }, { threshold: 0.25 }).observe(section);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) pause(); else play();
      });
    }

    each('.series-plot', setup);
  })();

  /* ------------------------------------------------------------------
     3. About: the publications and the gallery are both made as tall as
     the first row of journal covers, whatever the width of the page.
  ------------------------------------------------------------------ */
  (function listHeight() {
    var columns = document.querySelector('.about-cols');
    var covers = document.querySelector('.covers');
    if (!columns || !covers) return;
    function fit() {
      var h = covers.getBoundingClientRect().height;
      if (h > 60) columns.style.setProperty('--list-height', Math.round(h + 10) + 'px');
    }
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('load', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  })();

  /* ------------------------------------------------------------------
     3b. Footer clock: the current time in Porto and how far it is from
     the visitor's own clock, refreshed every 20 seconds.
  ------------------------------------------------------------------ */
  each('.js-clock', function (el) {
    var zone = el.dataset.tz;
    if (!zone || !window.Intl) return;
    var clock;
    try {
      clock = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit' });
    } catch (e) { return; }

    // Offset of a time zone from UTC, in minutes, at a given moment.
    function offset(date) {
      var parts = {};
      new Intl.DateTimeFormat('en-US', {
        timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric'
      }).formatToParts(date).forEach(function (p) { parts[p.type] = p.value; });
      var asUtc = Date.UTC(+parts.year, parts.month - 1, +parts.day, +parts.hour, +parts.minute);
      return Math.round((asUtc - date.getTime()) / 60000);
    }

    function difference(now) {
      var hours = (offset(now) + now.getTimezoneOffset()) / 60; // there minus here
      if (hours === 0) return 'same time as yours';
      var n = Math.abs(hours), size = (n % 1 ? n.toFixed(1).replace(/\.0$/, '') : n);
      return size + (n === 1 ? ' hour ' : ' hours ') + (hours > 0 ? 'ahead of you' : 'behind you');
    }

    function tick() {
      var now = new Date();
      el.textContent = clock.format(now) + ' local time, ' + difference(now);
    }
    tick();
    setInterval(tick, 20000);
  });

  /* ------------------------------------------------------------------
     4. E-mail: the address is written in two parts in the page source
     and joined here, which keeps it away from the simplest harvesters.
  ------------------------------------------------------------------ */
  each('.js-email', function (a) {
    var address = a.dataset.user + '@' + a.dataset.domain;
    a.href = 'mailto:' + address;
    a.textContent = address;
  });

  /* ------------------------------------------------------------------
     5. Catalogue: search, topic, software, sort and paging.
     State is mirrored in the URL (?q=&topic=&software=&sort=) so a
     filtered view can be shared as a link.
  ------------------------------------------------------------------ */
  var PAGE = 9; // cards shown before "Show all" when no filter is active
  var list = $('cards');
  if (!list) return;

  var cards = Array.prototype.slice.call(list.querySelectorAll('.card'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var q = $('q');
  var tool = $('tool'), sort = $('sort');
  var count = $('result-count'), empty = $('empty');
  var more = $('more'), moreBtn = $('more-btn');
  var catalogue = $('resources');
  var total = cards.length;
  var expanded = false;

  var state = { q: '', cat: 'all', tool: '', sort: 'new' };
  var params = new URLSearchParams(location.search);
  if (params.get('q')) state.q = params.get('q');
  if (params.get('topic')) state.cat = params.get('topic');
  if (params.get('software')) state.tool = params.get('software').toLowerCase();
  if (params.get('sort')) state.sort = params.get('sort');

  function isFiltered() { return !!(state.q || state.cat !== 'all' || state.tool); }

  function matches(el) {
    var d = el.dataset;
    if (state.cat !== 'all' && d.cat !== state.cat) return false;
    if (state.tool && d.tools.indexOf('|' + state.tool + '|') === -1) return false;
    if (state.q) {
      var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < words.length; i++) {
        if (d.search.indexOf(words[i]) === -1) return false;
      }
    }
    return true;
  }

  function byDate(a, b, dir) {
    // Entries without a date go last, in the order of the data file.
    var da = a.dataset.added, db = b.dataset.added;
    if (da && db && da !== db) return (da < db ? 1 : -1) * dir;
    if (da && !db) return -1;
    if (db && !da) return 1;
    return a.dataset.num - b.dataset.num;
  }

  function compare(a, b) {
    if (state.sort === 'az') return a.dataset.title.localeCompare(b.dataset.title);
    if (state.sort === 'old') return byDate(a, b, -1);
    return byDate(a, b, 1);
  }

  function syncUrl() {
    var p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.cat !== 'all') p.set('topic', state.cat);
    if (state.tool) p.set('software', state.tool);
    if (state.sort !== 'new') p.set('sort', state.sort);
    var s = p.toString();
    try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } catch (e) {}
  }

  function render() {
    var shown = 0, visible = 0;
    var limit = isFiltered() || expanded ? Infinity : PAGE;
    cards.sort(compare).forEach(function (card) {
      var ok = matches(card);
      if (ok) shown++;
      var show = ok && visible < limit;
      if (show) visible++;
      card.hidden = !show;
      list.appendChild(card);
    });

    chips.forEach(function (chip) { chip.setAttribute('aria-pressed', String(chip.dataset.cat === state.cat)); });
    each('.tools button', function (b) { b.setAttribute('aria-pressed', String(b.dataset.tool === state.tool)); });

    if (isFiltered()) count.textContent = 'Showing ' + shown + ' of ' + total + ' entries';
    else if (visible < shown) count.textContent = 'Showing the ' + visible + ' most recent of ' + total + ' entries';
    else count.textContent = 'Showing all ' + total + ' entries';

    more.hidden = visible >= shown;
    moreBtn.textContent = 'Show all ' + shown + ' entries';
    empty.hidden = shown !== 0;
    syncUrl();
  }

  function goToCatalogue() {
    var bar = document.querySelector('.toolbar') || catalogue;
    var top = bar.getBoundingClientRect().top;
    if (top > 120 || top < -10) bar.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function setQuery(v) {
    state.q = v.trim();
    q.value = state.q;
  }

  // Controls start from the URL state.
  setQuery(state.q);
  tool.value = state.tool;
  if (tool.value !== state.tool) state.tool = '';
  sort.value = state.sort;
  if (sort.value !== state.sort) state.sort = 'new';

  var typing;
  q.addEventListener('input', function () {
    clearTimeout(typing);
    typing = setTimeout(function () { setQuery(q.value); render(); }, 120);
  });
  tool.addEventListener('change', function () { state.tool = tool.value; render(); });
  sort.addEventListener('change', function () { state.sort = sort.value; render(); });

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () { state.cat = chip.dataset.cat; render(); });
  });

  // Software tags on a card filter by that program (click again to clear).
  list.addEventListener('click', function (e) {
    var b = e.target.closest('.tools button');
    if (!b) return;
    state.tool = state.tool === b.dataset.tool ? '' : b.dataset.tool;
    tool.value = state.tool;
    render();
    goToCatalogue();
  });

  moreBtn.addEventListener('click', function () {
    expanded = true;
    render();
  });

  $('clear').addEventListener('click', function () {
    state = { q: '', cat: 'all', tool: '', sort: state.sort };
    setQuery('');
    tool.value = '';
    render();
    q.focus();
  });

  // "/" focuses the catalogue search, as on many documentation sites.
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/input|select|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      goToCatalogue();
      q.focus({ preventScroll: true });
    }
  });

  render();
  if (isFiltered() && !location.hash) goToCatalogue();
})();
