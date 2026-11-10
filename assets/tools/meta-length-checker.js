(function () {
  'use strict';
  var $ = TB.$;
  var TITLE_PX = 600, DESC_PX = 920;
  var ctx = document.createElement('canvas').getContext('2d');
  function width(text, font) { ctx.font = font; return Math.round(ctx.measureText(text).width); }
  function cut(text, font, max) {
    if (width(text, font) <= max) return text;
    var lo = 0, hi = text.length;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (width(text.slice(0, mid) + ' ...', font) <= max) lo = mid; else hi = mid - 1; }
    return text.slice(0, lo).replace(/\s+\S*$/, '') + ' ...';
  }
  function bar(el, px, max) {
    var pct = Math.min(100, px / max * 100);
    el.style.width = pct + '%';
    el.className = px > max ? 'bad' : (px > max * 0.92 ? 'warn' : '');
  }
  function run() {
    var t = $('#m-title').value, d = $('#m-desc').value.replace(/\s+/g, ' ').trim();
    var tf = '20px Arial', df = '14px Arial';
    var tpx = width(t, tf), dpx = width(d, df);
    bar($('#m-tbar'), tpx, TITLE_PX); bar($('#m-dbar'), dpx, DESC_PX);
    var tmsg = t.length + ' characters, about ' + tpx + ' of ' + TITLE_PX + ' pixels. ';
    tmsg += !t ? 'Add a title.' : tpx > TITLE_PX ? 'Likely to be cut off. Move the key words to the front or shorten it.' : t.length < 30 ? 'Short. There is room for a benefit or brand.' : 'Good length.';
    TB.status($('#m-tstat'), tmsg, tpx > TITLE_PX ? 'err' : (t ? 'ok' : ''));
    var dmsg = d.length + ' characters, about ' + dpx + ' of ' + DESC_PX + ' pixels. ';
    dmsg += !d ? 'Add a description.' : dpx > DESC_PX ? 'Likely to be cut off on desktop.' : d.length < 70 ? 'Short. Search engines may replace a thin description with page text.' : 'Good length.';
    TB.status($('#m-dstat'), dmsg, dpx > DESC_PX ? 'err' : (d ? 'ok' : ''));
    var u = $('#m-url').value.trim();
    var pu = '';
    try { var x = new URL(u); pu = x.hostname + x.pathname.replace(/\/$/, '').split('/').filter(Boolean).map(function (p) { return ' > ' + p; }).join(''); } catch (e) { pu = u; }
    $('#m-purl').textContent = pu;
    $('#m-ptitle').textContent = cut(t || 'Untitled page', tf, TITLE_PX);
    $('#m-pdesc').textContent = cut(d, df, DESC_PX);
  }
  document.getElementById('tool').addEventListener('input', run);
  run();
})();
