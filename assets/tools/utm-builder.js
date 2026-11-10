(function () {
  'use strict';
  var $ = TB.$;
  var F = ['source', 'medium', 'campaign', 'term', 'content', 'id'];
  function clean(v) {
    v = v.trim();
    if ($('#u-lower').checked) v = v.toLowerCase();
    if ($('#u-spaces').checked) v = v.replace(/\s+/g, '-');
    return v;
  }
  function build() {
    var raw = $('#u-url').value.trim();
    var warn = [];
    var out = $('#u-out');
    if (!raw) { out.textContent = ''; TB.status($('#u-warn'), 'Enter a website URL to start.'); return ''; }
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) { raw = 'https://' + raw; warn.push('Added https:// to the URL.'); }
    var u;
    try { u = new URL(raw); } catch (e) { out.textContent = ''; TB.status($('#u-warn'), 'That URL is not valid. Check for typos.', 'err'); return ''; }
    F.forEach(function (k) {
      var v = clean($('#u-' + k).value);
      if (u.searchParams.has('utm_' + k) && v) warn.push('Replaced the existing utm_' + k + ' in the URL.');
      if (v) u.searchParams.set('utm_' + k, v);
    });
    if (!$('#u-source').value.trim()) warn.push('utm_source is required for GA4 to attribute the visit.');
    if (!$('#u-medium').value.trim()) warn.push('utm_medium is required for GA4 channel grouping.');
    var anyUpper = F.some(function (k) { return /[A-Z]/.test($('#u-' + k).value); });
    if (anyUpper && !$('#u-lower').checked) warn.push('Mixed case values split reports: "Email" and "email" count as two sources.');
    var s = u.toString();
    out.textContent = s;
    TB.status($('#u-warn'), warn.join(' '), warn.length && /required|valid/.test(warn.join(' ')) ? 'err' : (warn.length ? '' : 'ok'));
    if (!warn.length) TB.status($('#u-warn'), 'Ready to copy.', 'ok');
    return s;
  }
  document.addEventListener('input', function (e) { if (e.target.closest('#tool')) build(); });
  document.addEventListener('change', function (e) { if (e.target.closest('#tool')) build(); });
  $('#u-copy').addEventListener('click', function () { var s = build(); if (s) TB.copy(s, this); });
  $('#u-reset').addEventListener('click', function () {
    ['url'].concat(F).forEach(function (k) { $('#u-' + k).value = ''; });
    build();
  });
  build();
})();
