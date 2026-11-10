(function () {
  'use strict';
  var $ = TB.$;
  var STOP = ['a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with', 'at', 'by', 'from', 'is', 'are', 'was', 'be', 'as', 'it', 'its', 'your', 'you', 'how', 'what', 'why'];
  var MAP = { 'ß': 'ss', 'æ': 'ae', 'ø': 'o', 'đ': 'd', 'ł': 'l', 'œ': 'oe', 'þ': 'th', '&': ' and ', '@': ' at ', '+': ' plus ' };
  window.slugify = function (s, o) {
    o = o || {};
    var sep = o.sep || '-';
    s = String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '');
    s = s.replace(/[ßæøđłœþ&@+]/gi, function (c) { return MAP[c.toLowerCase()] || c; });
    s = s.replace(/['’]/g, '');
    if (o.lower !== false) s = s.toLowerCase();
    if (o.nums) s = s.replace(/[0-9]+/g, ' ');
    var words = s.split(/[^A-Za-z0-9]+/).filter(Boolean);
    if (o.stop) {
      var kept = words.filter(function (w) { return STOP.indexOf(w.toLowerCase()) === -1; });
      if (kept.length) words = kept;
    }
    var out = words.join(sep);
    if (o.max > 0 && out.length > o.max) {
      out = out.slice(0, o.max);
      var cut = out.lastIndexOf(sep);
      if (cut > o.max / 2) out = out.slice(0, cut);
    }
    return out.replace(new RegExp('\\' + sep + '+$'), '');
  };
  function run() {
    var o = { sep: $('#g-sep').value, max: parseInt($('#g-max').value, 10) || 0, stop: $('#g-stop').checked, nums: $('#g-nums').checked, lower: $('#g-lower').checked };
    $('#g-out').value = $('#g-in').value.split(/\r?\n/).filter(function (l) { return l.trim(); }).map(function (l) { return window.slugify(l, o); }).join('\n');
  }
  document.getElementById('tool').addEventListener('input', run);
  document.getElementById('tool').addEventListener('change', run);
  $('#g-copy').addEventListener('click', function () { TB.copy($('#g-out').value, this); });
  run();
})();
