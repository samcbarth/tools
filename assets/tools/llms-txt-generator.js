(function () {
  'use strict';
  var $ = TB.$;
  function abs(u, base) {
    try { return new URL(u, base || undefined).toString(); } catch (e) { return u; }
  }
  function gen() {
    var name = $('#l-name').value.trim() || 'Untitled site';
    var base = $('#l-url').value.trim();
    var lines = ['# ' + name, ''];
    var warn = [];
    if ($('#l-sum').value.trim()) lines.push('> ' + $('#l-sum').value.trim().replace(/\s+/g, ' '), '');
    var det = $('#l-details').value.trim();
    if (det) lines.push(det, '');
    var count = 0, inSection = false;
    $('#l-links').value.split(/\r?\n/).forEach(function (raw) {
      var line = raw.trim();
      if (!line) return;
      if (/^#{1,6}\s*/.test(line)) {
        if (inSection) lines.push('');
        lines.push('## ' + line.replace(/^#{1,6}\s*/, ''));
        inSection = true;
        return;
      }
      var parts = line.split('|').map(function (s) { return s.trim(); });
      if (parts.length < 2 || !parts[1]) { warn.push('Skipped a line with no URL: "' + line + '"'); return; }
      if (!inSection) { lines.push('## Pages'); inSection = true; }
      var url = abs(parts[1], base);
      if (!/^https?:\/\//.test(url)) warn.push('"' + parts[0] + '" has a relative URL; add the site URL above.');
      lines.push('- [' + parts[0] + '](' + url + ')' + (parts[2] ? ': ' + parts[2] : ''));
      count++;
    });
    var txt = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    $('#l-out').value = txt;
    TB.status($('#l-status'), warn.length ? warn.join(' ') : count + ' links. Upload the file to your site root so it loads at /llms.txt.', warn.length ? 'err' : 'ok');
  }
  document.getElementById('tool').addEventListener('input', TB.debounce(gen, 120));
  $('#l-copy').addEventListener('click', function () { TB.copy($('#l-out').value, this); });
  $('#l-dl').addEventListener('click', function () { TB.download('llms.txt', $('#l-out').value); });
  gen();
})();
