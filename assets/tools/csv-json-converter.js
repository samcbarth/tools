(function () {
  'use strict';
  var $ = TB.$, $$ = TB.$$;
  var dir = 'c2j';
  function typed(v) {
    if (!$('#k-types').checked) return v;
    var t = v.trim();
    if (t === '') return '';
    if (t === 'true') return true;
    if (t === 'false') return false;
    if (t === 'null') return null;
    if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(t) && t.length < 16) return Number(t);
    return v;
  }
  function setPath(obj, key, val) {
    var parts = key.split('.');
    var o = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (typeof o[parts[i]] !== 'object' || o[parts[i]] === null) o[parts[i]] = {};
      o = o[parts[i]];
    }
    o[parts[parts.length - 1]] = val;
  }
  function c2j() {
    var text = $('#k-in').value;
    var rows = TB.parseCSV(text, TB.detectDelimiter(text)).filter(function (r) { return r.some(function (v) { return v !== ''; }); });
    if (!rows.length) return '';
    if ($('#k-arrays').checked) return JSON.stringify(rows.map(function (r, i) { return i ? r.map(typed) : r; }), null, 2);
    var head = rows[0].map(function (h, i) { return h.trim() || 'column' + (i + 1); });
    var out = rows.slice(1).map(function (r) {
      var o = {};
      head.forEach(function (h, i) {
        var v = typed(r[i] == null ? '' : r[i]);
        if ($('#k-nested').checked && h.indexOf('.') > 0) setPath(o, h, v); else o[h] = v;
      });
      return o;
    });
    TB.status($('#k-status'), out.length + ' rows converted.', 'ok');
    return JSON.stringify(out, null, 2);
  }
  function flatten(o, prefix, out) {
    Object.keys(o).forEach(function (k) {
      var v = o[k], key = prefix ? prefix + '.' + k : k;
      if (v && typeof v === 'object' && !Array.isArray(v) && $('#k-flat').checked) flatten(v, key, out);
      else out[key] = v;
    });
    return out;
  }
  function j2c() {
    var data = JSON.parse($('#k-in').value);
    if (!Array.isArray(data)) {
      var arr = Object.keys(data).map(function (k) { return data[k]; }).filter(Array.isArray)[0];
      data = arr || [data];
    }
    var flat = data.map(function (r) { return r && typeof r === 'object' && !Array.isArray(r) ? flatten(r, '', {}) : { value: r }; });
    var head = [];
    flat.forEach(function (r) { Object.keys(r).forEach(function (k) { if (head.indexOf(k) === -1) head.push(k); }); });
    var rows = [head].concat(flat.map(function (r) {
      return head.map(function (h) { var v = r[h]; return v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v)); });
    }));
    TB.status($('#k-status'), flat.length + ' rows, ' + head.length + ' columns.', 'ok');
    return TB.toCSV(rows, $('#k-delim').value);
  }
  function run() {
    try { $('#k-out').value = dir === 'c2j' ? c2j() : j2c(); }
    catch (e) { $('#k-out').value = ''; TB.status($('#k-status'), 'Could not read the input: ' + e.message, 'err'); }
  }
  function setDir(d) {
    dir = d;
    $$('[data-dir]').forEach(function (x) { x.setAttribute('aria-selected', x.getAttribute('data-dir') === d ? 'true' : 'false'); });
    $('#k-in-label').textContent = d === 'c2j' ? 'CSV input' : 'JSON input';
    $('#k-out-label').textContent = d === 'c2j' ? 'JSON output' : 'CSV output';
    $('#k-c2j-opts').hidden = d !== 'c2j';
    $('#k-j2c-opts').hidden = d === 'c2j';
    run();
  }
  $$('[data-dir]').forEach(function (b) { b.addEventListener('click', function () { setDir(b.getAttribute('data-dir')); }); });
  $('#k-in').addEventListener('input', TB.debounce(run, 200));
  $$('#tool input[type=checkbox], #k-delim').forEach(function (c) { c.addEventListener('change', run); });
  TB.fileToTextarea($('#k-file'), $('#k-in'), function (f) { setDir(/\.json$/i.test(f.name) ? 'j2c' : 'c2j'); });
  $('#k-copy').addEventListener('click', function () { TB.copy($('#k-out').value, this); });
  $('#k-dl').addEventListener('click', function () {
    if (dir === 'c2j') TB.download('data.json', $('#k-out').value, 'application/json');
    else TB.download('data.csv', '﻿' + $('#k-out').value, 'text/csv;charset=utf-8');
  });
  $('#k-swap').addEventListener('click', function () {
    var out = $('#k-out').value;
    if (!out) return;
    $('#k-in').value = out;
    setDir(dir === 'c2j' ? 'j2c' : 'c2j');
  });
  run();
})();
