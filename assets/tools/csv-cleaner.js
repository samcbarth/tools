(function () {
  'use strict';
  var $ = TB.$, esc = TB.esc;
  var fileName = 'cleaned.csv';
  function delim() { var d = $('#c-delim').value; return d === 'auto' ? TB.detectDelimiter($('#c-in').value) : d; }
  function headersChanged() {
    var rows = TB.parseCSV($('#c-in').value, delim());
    var sel = $('#c-key'), cur = sel.value;
    var head = rows[0] || [];
    sel.innerHTML = '<option value="__row">Whole row</option>' + head.map(function (h, i) { return '<option value="' + i + '">' + esc(h.trim() || 'Column ' + (i + 1)) + '</option>'; }).join('');
    if (cur !== '__row' && cur < head.length) sel.value = cur;
    else {
      var em = head.findIndex(function (h) { return /e-?mail/i.test(h); });
      if (em >= 0 && cur === '__row' && !sel.dataset.touched) sel.value = String(em);
    }
  }
  function run() {
    var d = delim();
    var rows = TB.parseCSV($('#c-in').value, d);
    if (!rows.length) { $('#c-out').value = ''; $('#c-stats').innerHTML = ''; $('#c-preview').innerHTML = ''; return; }
    var head = rows[0], body = rows.slice(1);
    var width = head.length, blank = 0, dupes = 0, trimmed = 0;
    if ($('#c-headers').checked) head = head.map(function (h) { return h.replace(/\s+/g, ' ').trim(); });
    var seen = {}, out = [];
    body.forEach(function (r) {
      while (r.length < width) r.push('');
      if ($('#c-trim').checked) r = r.map(function (v) { var t = v.replace(/\s+/g, ' ').trim(); if (t !== v) trimmed++; return t; });
      if ($('#c-blank').checked && r.every(function (v) { return !String(v).trim(); })) { blank++; return; }
      if ($('#c-dedupe').checked) {
        var k = $('#c-key').value === '__row' ? r.join('\u0001') : r[+$('#c-key').value] || '';
        if ($('#c-ci').checked) k = k.toLowerCase();
        if (k !== '' && seen[k]) { dupes++; return; }
        seen[k] = 1;
      }
      out.push(r);
    });
    var all = [head].concat(out);
    $('#c-out').value = TB.toCSV(all, d);
    $('#c-stats').innerHTML = [['Rows in', body.length], ['Rows out', out.length], ['Duplicates removed', dupes], ['Empty rows removed', blank], ['Cells trimmed', trimmed]]
      .map(function (s) { return '<div class="stat"><b>' + s[1] + '</b><span>' + s[0] + '</span></div>'; }).join('');
    $('#c-preview').innerHTML = '<table><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      out.slice(0, 20).map(function (r) { return '<tr>' + r.map(function (v) { return '<td>' + esc(v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' +
      (out.length > 20 ? '<p class="hint" style="padding:6px 10px">Showing the first 20 of ' + out.length + ' rows.</p>' : '');
  }
  $('#c-key').addEventListener('change', function () { this.dataset.touched = '1'; run(); });
  $('#c-in').addEventListener('input', TB.debounce(function () { headersChanged(); run(); }, 250));
  $('#c-delim').addEventListener('change', function () { headersChanged(); run(); });
  TB.$$('#tool input[type=checkbox]').forEach(function (c) { c.addEventListener('change', run); });
  $('#c-run').addEventListener('click', run);
  TB.fileToTextarea($('#c-file'), $('#c-in'), function (f) { fileName = f.name.replace(/\.\w+$/, '') + '-clean.csv'; });
  $('#c-copy').addEventListener('click', function () { TB.copy($('#c-out').value, this); });
  $('#c-dl').addEventListener('click', function () { TB.download(fileName, '﻿' + $('#c-out').value, 'text/csv;charset=utf-8'); });
  headersChanged(); run();
})();
