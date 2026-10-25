/* CompBioChem Tutorials: search, filters and paging of the tutorial cards. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PAGE = 9; // cards shown before "Show all" when no filter is active

  function $(id) { return document.getElementById(id); }
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }

  /* ------------------------------------------------------------------
     Catalogue: search, topic, software, sort and paging.
     State is mirrored in the URL (?q=&topic=&software=&sort=) so a
     filtered view can be shared as a link.
  ------------------------------------------------------------------ */
  var list = $('cards');
  if (!list) return;

  var cards = Array.prototype.slice.call(list.querySelectorAll('.card'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var q = $('q');
  var tool = $('tool'), sort = $('sort');
  var count = $('result-count'), empty = $('empty');
  var more = $('more'), moreBtn = $('more-btn');
  var catalogue = $('catalogue');
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
    var top = catalogue.getBoundingClientRect().top;
    if (top > 120 || top < -10) catalogue.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
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
