(function () {
  'use strict';
  var $ = TB.$;
  var TYPOS = {
    'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gamil.com': 'gmail.com',
    'gnail.com': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmail.con': 'gmail.com',
    'hotmial.com': 'hotmail.com', 'hotmal.com': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotmail.con': 'hotmail.com',
    'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahoo.co': 'yahoo.com', 'yahoo.con': 'yahoo.com',
    'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'outlook.co': 'outlook.com', 'outlook.con': 'outlook.com',
    'iclod.com': 'icloud.com', 'icloud.co': 'icloud.com', 'icoud.com': 'icloud.com'
  };
  var ROLES = ['info', 'admin', 'sales', 'support', 'contact', 'hello', 'office', 'help', 'billing', 'marketing', 'noreply', 'no-reply', 'webmaster', 'postmaster', 'abuse', 'team', 'jobs', 'careers', 'hr'];
  var FIND = /[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+/g;
  var VALID = /^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
  var result = [];

  function run() {
    var text = $('#e-in').value;
    var found = text.match(FIND) || [];
    var log = [], seen = {}, out = [], invalid = 0, dupes = 0, fixed = 0, roles = 0;
    found.forEach(function (raw) {
      var e = raw.replace(/^[.'`]+|[.'`]+$/g, '');
      if ($('#e-lower').checked) e = e.toLowerCase();
      var parts = e.split('@');
      var local = parts[0], domain = parts[1].toLowerCase();
      if ($('#e-typos').checked && TYPOS[domain]) { log.push(e + '  ->  fixed domain to ' + TYPOS[domain]); domain = TYPOS[domain]; fixed++; }
      e = local + '@' + domain;
      if (!VALID.test(e) || local.indexOf('..') !== -1 || /^\.|\.$/.test(local)) { log.push(raw + '  ->  removed, invalid format'); invalid++; return; }
      if ($('#e-role').checked && ROLES.indexOf(local.toLowerCase()) !== -1) { log.push(e + '  ->  removed, role address'); roles++; return; }
      var key = e.toLowerCase();
      if ($('#e-dedupe').checked && seen[key]) { dupes++; return; }
      seen[key] = 1;
      out.push(e);
    });
    if ($('#e-sort').checked) out.sort(function (a, b) { return a.localeCompare(b); });
    result = out;
    $('#e-out').value = out.join('\n');
    $('#e-log').textContent = log.length ? log.join('\n') : 'Nothing removed or changed.';
    $('#e-stats').innerHTML = [['Found', found.length], ['Clean', out.length], ['Duplicates removed', dupes], ['Typos fixed', fixed], ['Invalid removed', invalid], ['Role removed', roles]]
      .map(function (s) { return '<div class="stat"><b>' + s[1] + '</b><span>' + s[0] + '</span></div>'; }).join('');
  }
  $('#e-run').addEventListener('click', run);
  $('#e-in').addEventListener('input', TB.debounce(run, 250));
  TB.$$('#tool input[type=checkbox]').forEach(function (c) { c.addEventListener('change', run); });
  TB.fileToTextarea($('#e-file'), $('#e-in'));
  $('#e-copy').addEventListener('click', function () { TB.copy($('#e-out').value, this); });
  $('#e-csv').addEventListener('click', function () {
    TB.download('clean-emails.csv', TB.toCSV([['email']].concat(result.map(function (e) { return [e]; }))), 'text/csv;charset=utf-8');
  });
})();
