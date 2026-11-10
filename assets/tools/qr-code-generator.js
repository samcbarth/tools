(function () {
  'use strict';
  var $ = TB.$, $$ = TB.$$;
  if (qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  var mode = 'url', current = null;
  function wifiEsc(s) { return s.replace(/([\\;,":])/g, '\\$1'); }
  function payload() {
    if (mode === 'wifi') {
      var sec = $('#q-sec').value;
      return 'WIFI:T:' + sec + ';S:' + wifiEsc($('#q-ssid').value) + ';' + (sec === 'nopass' ? '' : 'P:' + wifiEsc($('#q-pass').value) + ';') + ';';
    }
    if (mode === 'email') return 'mailto:' + $('#q-to').value.trim() + ($('#q-sub').value ? '?subject=' + encodeURIComponent($('#q-sub').value) : '');
    return $('#q-text').value;
  }
  function matrix(text) {
    var qr = qrcode(0, $('#q-ec').value);
    qr.addData(text, 'Byte');
    qr.make();
    return qr;
  }
  function svgString(qr, size, fg, bg) {
    var n = qr.getModuleCount(), quiet = 4, total = n + quiet * 2, d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) d += 'M' + (c + quiet) + ' ' + (r + quiet) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges">' +
      '<rect width="100%" height="100%" fill="' + bg + '"/><path d="' + d + '" fill="' + fg + '"/></svg>';
  }
  function run() {
    var text = payload();
    if (!text) { $('#q-out').innerHTML = ''; TB.status($('#q-status'), 'Enter something to encode.'); current = null; return; }
    try {
      var qr = matrix(text);
      var size = Math.max(100, Math.min(2000, parseInt($('#q-size').value, 10) || 400));
      current = { qr: qr, size: size, fg: $('#q-fg').value, bg: $('#q-bg').value };
      var svg = svgString(qr, Math.min(size, 320), current.fg, current.bg);
      $('#q-out').innerHTML = svg;
      $('#q-out').firstChild.setAttribute('role', 'img');
      $('#q-out').firstChild.setAttribute('aria-label', 'QR code');
      TB.status($('#q-status'), 'Version ' + ((qr.getModuleCount() - 17) / 4) + ', ' + qr.getModuleCount() + ' x ' + qr.getModuleCount() + ' modules. Test-scan it with your phone before printing.', 'ok');
    } catch (e) {
      current = null; $('#q-out').innerHTML = '';
      TB.status($('#q-status'), 'Too much data for a QR code at this error correction level. Shorten it or pick a lower level.', 'err');
    }
  }
  function png() {
    if (!current) return;
    var n = current.qr.getModuleCount() + 8, scale = current.size / n;
    var c = document.createElement('canvas'); c.width = c.height = current.size;
    var ctx = c.getContext('2d');
    ctx.fillStyle = current.bg; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = current.fg;
    for (var r = 0; r < n - 8; r++) for (var col = 0; col < n - 8; col++) {
      if (current.qr.isDark(r, col)) ctx.fillRect(Math.floor((col + 4) * scale), Math.floor((r + 4) * scale), Math.ceil(scale), Math.ceil(scale));
    }
    c.toBlob(function (b) { TB.download('qr-code.png', b); }, 'image/png');
  }
  $$('[data-q]').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.getAttribute('data-q');
      $$('[data-q]').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      ['url', 'wifi', 'email'].forEach(function (k) { $('#q-' + k).hidden = k !== mode; });
      run();
    });
  });
  document.getElementById('tool').addEventListener('input', TB.debounce(run, 120));
  document.getElementById('tool').addEventListener('change', run);
  $('#q-png').addEventListener('click', png);
  $('#q-svg').addEventListener('click', function () { if (current) TB.download('qr-code.svg', svgString(current.qr, current.size, current.fg, current.bg), 'image/svg+xml'); });
  window.__qrPayload = payload;
  run();
})();
