(function () {
  'use strict';
  var $ = TB.$, esc = TB.esc;
  var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
  window.parseStamp = function (s) {
    s = String(s).trim();
    if (!s) return null;
    if (/^-?\d+(\.\d+)?$/.test(s)) {
      var n = parseFloat(s), digits = s.replace(/^-/, '').split('.')[0].length;
      if (digits >= 17) return { d: new Date(n / 1e6), unit: 'nanoseconds' };
      if (digits >= 14) return { d: new Date(n / 1e3), unit: 'microseconds' };
      if (digits >= 12) return { d: new Date(n), unit: 'milliseconds' };
      return { d: new Date(n * 1000), unit: 'seconds' };
    }
    var iso = s.replace(/^(\d{4}-\d{2}-\d{2}) (\d)/, '$1T$2');
    var d = new Date(iso);
    if (isNaN(d)) d = new Date(s);
    return isNaN(d) ? null : { d: d, unit: 'date text' };
  };
  function rel(d) {
    var diff = (d - Date.now()) / 1000, a = Math.abs(diff);
    var units = [[31536000, 'year'], [2592000, 'month'], [86400, 'day'], [3600, 'hour'], [60, 'minute'], [1, 'second']];
    for (var i = 0; i < units.length; i++) if (a >= units[i][0] || i === units.length - 1) {
      var v = Math.round(a / units[i][0]);
      return v + ' ' + units[i][1] + (v === 1 ? '' : 's') + (diff < 0 ? ' ago' : ' from now');
    }
  }
  function row(k, v) { return '<tr><th scope="row">' + k + '</th><td class="mono">' + esc(v) + '</td></tr>'; }
  function run() {
    var p = window.parseStamp($('#t-in').value);
    if (!p || isNaN(p.d)) { $('#t-out').innerHTML = ''; TB.status($('#t-status'), 'Could not read that. Try 1794268800 or 2026-11-09T14:30:00Z.', 'err'); return; }
    var d = p.d;
    TB.status($('#t-status'), 'Read as ' + p.unit + '.', 'ok');
    $('#t-out').innerHTML = [
      row('Unix seconds', String(Math.floor(d.getTime() / 1000))),
      row('Unix milliseconds', String(d.getTime())),
      row('ISO 8601 (UTC)', d.toISOString()),
      row('UTC', d.toUTCString()),
      row('Your time (' + tz + ')', d.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' })),
      row('Relative', rel(d)),
      row('Day of year', String(Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000)))
    ].join('');
  }
  function build() {
    var v = $('#t-local').value;
    if (!v) { $('#t-built').textContent = ''; return; }
    var d = $('#t-zone').value === 'utc' ? new Date(v + (v.length === 16 ? ':00' : '') + 'Z') : new Date(v);
    $('#t-built').textContent = isNaN(d) ? 'Invalid date' : 'Unix seconds: ' + Math.floor(d.getTime() / 1000) + '\nMilliseconds: ' + d.getTime() + '\nISO 8601: ' + d.toISOString();
  }
  $('#t-in').addEventListener('input', run);
  $('#t-now').addEventListener('click', function () { $('#t-in').value = String(Math.floor(Date.now() / 1000)); run(); });
  $('#t-local').addEventListener('input', build);
  $('#t-zone').addEventListener('change', build);
  var now = new Date(); now.setSeconds(0, 0);
  $('#t-local').value = new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
  run(); build();
})();
