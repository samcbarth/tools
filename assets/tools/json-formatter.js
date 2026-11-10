(function () {
  'use strict';
  var $ = TB.$;
  function sortKeys(v) {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (v && typeof v === 'object') {
      var o = {};
      Object.keys(v).sort().forEach(function (k) { o[k] = sortKeys(v[k]); });
      return o;
    }
    return v;
  }
  function where(text, msg) {
    var m = msg.match(/position (\d+)/) || msg.match(/column (\d+)/);
    var lc = msg.match(/line (\d+) column (\d+)/);
    if (lc) return ' (line ' + lc[1] + ', column ' + lc[2] + ')';
    if (!m) return '';
    var pos = +m[1], before = text.slice(0, pos).split('\n');
    return ' (line ' + before.length + ', column ' + (before[before.length - 1].length + 1) + ')';
  }
  function parse() {
    var text = $('#f-in').value;
    if (!text.trim()) { TB.status($('#f-status'), 'Paste some JSON to start.'); return undefined; }
    try {
      var v = JSON.parse(text);
      return $('#f-sort').checked ? sortKeys(v) : v;
    } catch (e) {
      var hint = '';
      if (/'/.test(text) && !/"/.test(text)) hint = ' JSON needs double quotes, not single quotes.';
      else if (/,\s*[}\]]/.test(text)) hint = ' Look for a trailing comma before } or ].';
      TB.status($('#f-status'), 'Invalid JSON: ' + e.message + where(text, e.message) + '.' + hint, 'err');
      $('#f-out').value = '';
      return undefined;
    }
  }
  function format() {
    var v = parse(); if (v === undefined) return;
    var ind = $('#f-indent').value === 'tab' ? '\t' : +$('#f-indent').value;
    $('#f-out').value = JSON.stringify(v, null, ind);
    TB.status($('#f-status'), 'Valid JSON. ' + TB.formatBytes(new Blob([$('#f-out').value]).size) + ' formatted.', 'ok');
  }
  function minify() {
    var v = parse(); if (v === undefined) return;
    $('#f-out').value = JSON.stringify(v);
    TB.status($('#f-status'), 'Valid JSON. Minified to ' + TB.formatBytes(new Blob([$('#f-out').value]).size) + '.', 'ok');
  }
  $('#f-format').addEventListener('click', format);
  $('#f-min').addEventListener('click', minify);
  $('#f-in').addEventListener('input', TB.debounce(format, 300));
  $('#f-indent').addEventListener('change', format);
  $('#f-sort').addEventListener('change', format);
  TB.fileToTextarea($('#f-file'), $('#f-in'));
  $('#f-copy').addEventListener('click', function () { TB.copy($('#f-out').value, this); });
  $('#f-dl').addEventListener('click', function () { TB.download('formatted.json', $('#f-out').value, 'application/json'); });
  format();
})();
