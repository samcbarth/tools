(function () {
  'use strict';
  var $ = TB.$, $$ = TB.$$, esc = TB.esc;
  var MAX = 5000;
  function flags() { return $$('#x-flags input:checked').map(function (c) { return c.value; }).join(''); }
  function run() {
    var pat = $('#x-pat').value, text = $('#x-text').value, f = flags(), re;
    if (!pat) { $('#x-hl').textContent = text; $('#x-table').innerHTML = ''; $('#x-repout').textContent = ''; TB.status($('#x-status'), 'Type a pattern.'); return; }
    try { re = new RegExp(pat, f.indexOf('g') === -1 ? f + 'g' : f); }
    catch (e) { TB.status($('#x-status'), e.message, 'err'); $('#x-hl').textContent = text; $('#x-table').innerHTML = ''; return; }
    var matches = [], m, guard = 0;
    while ((m = re.exec(text)) && guard++ < MAX) {
      matches.push(m);
      if (m[0] === '') re.lastIndex++;
      if (f.indexOf('g') === -1) break;
    }
    var html = '', last = 0;
    matches.forEach(function (mm, i) {
      if (mm[0] === '') return;
      html += esc(text.slice(last, mm.index)) + '<mark' + (i % 2 ? ' class="alt"' : '') + '>' + esc(mm[0]) + '</mark>';
      last = mm.index + mm[0].length;
    });
    $('#x-hl').innerHTML = html + esc(text.slice(last));
    var groups = matches.reduce(function (n, mm) { return Math.max(n, mm.length - 1); }, 0);
    $('#x-table').innerHTML = matches.length ? '<table><thead><tr><th>#</th><th>Match</th><th>Index</th>' +
      Array.from({ length: groups }, function (_, i) { return '<th>Group ' + (i + 1) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      matches.slice(0, 200).map(function (mm, i) {
        var g = ''; for (var k = 1; k <= groups; k++) g += '<td>' + (mm[k] === undefined ? '<span class="hint">none</span>' : esc(mm[k])) + '</td>';
        return '<tr><td>' + (i + 1) + '</td><td>' + esc(mm[0]) + '</td><td>' + mm.index + '</td>' + g + '</tr>';
      }).join('') + '</tbody></table>' : '';
    TB.status($('#x-status'), matches.length + ' match' + (matches.length === 1 ? '' : 'es') + (guard >= MAX ? ' (stopped at ' + MAX + ')' : '') + '.', matches.length ? 'ok' : '');
    try { $('#x-repout').textContent = text.replace(new RegExp(pat, f), $('#x-rep').value); } catch (e) { $('#x-repout').textContent = ''; }
  }
  document.getElementById('tool').addEventListener('input', TB.debounce(run, 120));
  document.getElementById('tool').addEventListener('change', run);
  $('#x-copy').addEventListener('click', function () { TB.copy('/' + $('#x-pat').value.replace(/\//g, '\\/') + '/' + flags(), this); });
  run();
})();
