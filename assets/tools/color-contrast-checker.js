(function () {
  'use strict';
  var $ = TB.$;
  function parse(s) {
    s = s.trim().toLowerCase();
    var m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (m) {
      var h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
      return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); });
    }
    m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) return [+m[1], +m[2], +m[3]].map(function (v) { return Math.min(255, v); });
    return null;
  }
  function hex(c) { return '#' + c.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); }
  function lum(c) {
    var a = c.map(function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function ratio(a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
  window.contrastRatio = function (a, b) { return ratio(parse(a), parse(b)); };
  /* Nudge the text color darker or lighter until it reaches the target ratio. */
  function suggest(fg, bg, target) {
    var dark = lum(bg) > 0.18;
    for (var t = 0; t <= 1.0001; t += 0.01) {
      var c = fg.map(function (v) { return dark ? v * (1 - t) : v + (255 - v) * t; });
      if (ratio(c, bg) >= target) return hex(c);
    }
    return null;
  }
  function run() {
    var fg = parse($('#n-fg').value), bg = parse($('#n-bg').value);
    if (!fg || !bg) { TB.status($('#n-fix'), 'Use hex like #1a73e8 or rgb(26, 115, 232).', 'err'); return; }
    $('#n-fgp').value = hex(fg); $('#n-bgp').value = hex(bg);
    $('#n-sw').style.color = hex(fg); $('#n-sw').style.background = hex(bg);
    var r = ratio(fg, bg), rs = (Math.floor(r * 100) / 100).toFixed(2);
    $('#n-stats').innerHTML = '<div class="stat"><b>' + rs + ':1</b><span>Contrast ratio</span></div>';
    var rows = [['AA normal text', 4.5], ['AA large text (24px, or 18.66px bold)', 3], ['AAA normal text', 7], ['AAA large text', 4.5], ['AA icons and UI parts', 3]];
    $('#n-res').innerHTML = '<div class="table-wrap"><table><tbody>' + rows.map(function (x) {
      var ok = r >= x[1];
      return '<tr><td>' + x[0] + '</td><td>needs ' + x[1] + ':1</td><td><span class="pill ' + (ok ? 'good' : 'bad') + '">' + (ok ? 'Pass' : 'Fail') + '</span></td></tr>';
    }).join('') + '</tbody></table></div>';
    if (r < 4.5) {
      var s = suggest(fg, bg, 4.5);
      TB.status($('#n-fix'), s ? 'Closest text color that passes AA for normal text: ' + s + '.' : 'Change the background; no text shade reaches 4.5:1 on it.', '');
    } else TB.status($('#n-fix'), 'Passes WCAG AA for body text.', 'ok');
  }
  $('#n-fgp').addEventListener('input', function () { $('#n-fg').value = this.value; run(); });
  $('#n-bgp').addEventListener('input', function () { $('#n-bg').value = this.value; run(); });
  $('#n-fg').addEventListener('input', run);
  $('#n-bg').addEventListener('input', run);
  $('#n-swap').addEventListener('click', function () { var a = $('#n-fg').value; $('#n-fg').value = $('#n-bg').value; $('#n-bg').value = a; run(); });
  run();
})();
