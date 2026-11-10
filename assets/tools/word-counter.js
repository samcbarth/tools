(function () {
  'use strict';
  var $ = TB.$, esc = TB.esc;
  var STOP = 'a an the and or but of to in on for with at by from is are was were be been it its this that these those as i you we they he she your our their my not no so if then than do does did have has had will would can could just'.split(' ');
  /* Limits as documented by each platform; meta lengths are common SEO guidance, not hard limits. */
  var LIMITS = [
    ['Meta title (guidance)', 60], ['Meta description (guidance)', 160], ['X post (standard account)', 280],
    ['LinkedIn post', 3000], ['Instagram caption', 2200], ['SMS segment (GSM-7)', 160]
  ];
  var seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null;
  function words(t) {
    if (seg) return Array.from(seg.segment(t)).filter(function (s) { return s.isWordLike; }).map(function (s) { return s.segment; });
    return t.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || [];
  }
  function run() {
    var t = $('#w-in').value;
    var w = words(t);
    var chars = Array.from(t).length;
    var noSpace = Array.from(t.replace(/\s/g, '')).length;
    var sentences = (t.match(/[^.!?\n]+[.!?]+(\s|$)/g) || []).length || (t.trim() ? 1 : 0);
    var paras = t.split(/\n\s*\n/).filter(function (p) { return p.trim(); }).length;
    var mins = w.length / 238;
    var read = w.length ? (mins < 1 ? 'under 1 min' : Math.round(mins) + ' min') : '0 min';
    $('#w-stats').innerHTML = [['Words', w.length], ['Characters', chars], ['Characters, no spaces', noSpace], ['Sentences', sentences], ['Paragraphs', paras], ['Reading time', read]]
      .map(function (s) { return '<div class="stat"><b>' + s[1] + '</b><span>' + s[0] + '</span></div>'; }).join('');
    $('#w-limits').innerHTML = LIMITS.map(function (l) {
      var pct = Math.min(100, chars / l[1] * 100), over = chars > l[1];
      return '<div><span>' + esc(l[0]) + ': ' + chars + ' / ' + l[1] + (over ? ' <span class="pill bad">over by ' + (chars - l[1]) + '</span>' : '') + '</span><div class="meter"><i class="' + (over ? 'bad' : pct > 90 ? 'warn' : '') + '" style="width:' + pct + '%"></i></div></div>';
    }).join('');
    var freq = {};
    w.forEach(function (x) { x = x.toLowerCase(); if (x.length > 2 && STOP.indexOf(x) === -1) freq[x] = (freq[x] || 0) + 1; });
    $('#w-top').innerHTML = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a] || a.localeCompare(b); }).slice(0, 12)
      .map(function (k) { return '<span class="pill">' + esc(k) + ' ' + freq[k] + '</span>'; }).join('') || '<span class="hint">None yet</span>';
  }
  $('#w-in').addEventListener('input', run);
  $('#w-clear').addEventListener('click', function () { $('#w-in').value = ''; run(); $('#w-in').focus(); });
  run();
})();
