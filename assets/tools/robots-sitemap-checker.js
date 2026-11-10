(function () {
  'use strict';
  var $ = TB.$, $$ = TB.$$, esc = TB.esc;
  var KNOWN = ['user-agent', 'allow', 'disallow', 'sitemap', 'crawl-delay', 'host', 'clean-param'];

  /* ---------- robots.txt (RFC 9309 matching) ---------- */
  function parseRobots(text) {
    var groups = [], cur = null, lastWasUA = false, sitemaps = [], issues = [];
    text.split(/\r?\n/).forEach(function (raw, i) {
      var line = raw.replace(/#.*$/, '').trim();
      if (!line) return;
      var m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
      if (!m) { issues.push('Line ' + (i + 1) + ' is not a "field: value" line: ' + raw.trim()); return; }
      var key = m[1].toLowerCase(), val = m[2].trim();
      if (KNOWN.indexOf(key) === -1) issues.push('Line ' + (i + 1) + ': "' + m[1] + '" is not a standard directive; most crawlers ignore it.');
      if (key === 'user-agent') {
        if (!lastWasUA || !cur) { cur = { agents: [], rules: [], line: i + 1 }; groups.push(cur); }
        cur.agents.push(val.toLowerCase());
        lastWasUA = true;
        return;
      }
      lastWasUA = false;
      if (key === 'sitemap') { sitemaps.push(val); if (!/^https?:\/\//i.test(val)) issues.push('Sitemap URL on line ' + (i + 1) + ' must be absolute.'); return; }
      if (key === 'allow' || key === 'disallow') {
        if (!cur) { issues.push('Line ' + (i + 1) + ' has a rule before any User-agent line; it is ignored.'); return; }
        if (val === '' && key === 'disallow') return; // empty disallow = allow all
        cur.rules.push({ allow: key === 'allow', path: val });
      }
      if (key === 'crawl-delay') issues.push('Crawl-delay is ignored by Google. Bing and some others respect it.');
    });
    return { groups: groups, sitemaps: sitemaps, issues: issues };
  }
  function toRegex(p) {
    var anchored = p.slice(-1) === '$';
    if (anchored) p = p.slice(0, -1);
    var r = p.split('*').map(function (s) { return s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'); }).join('.*');
    return new RegExp('^' + r + (anchored ? '$' : ''));
  }
  function test(parsed, ua, path) {
    var token = ua.trim().toLowerCase().split(/[\s\/]/)[0];
    var match = parsed.groups.filter(function (g) { return g.agents.indexOf(token) !== -1; });
    var used = token;
    if (!match.length) { match = parsed.groups.filter(function (g) { return g.agents.indexOf('*') !== -1; }); used = '*'; }
    if (!match.length) return { allowed: true, why: 'No group matches "' + ua + '" and there is no * group, so everything is allowed.' };
    var rules = [];
    match.forEach(function (g) { rules = rules.concat(g.rules); });
    var best = null;
    rules.forEach(function (r) {
      if (!toRegex(r.path).test(path)) return;
      var len = r.path.replace(/\$$/, '').length;
      if (!best || len > best.len || (len === best.len && r.allow && !best.r.allow)) best = { r: r, len: len };
    });
    if (!best) return { allowed: true, why: 'Group "' + used + '" has no rule matching ' + path + ', so it is allowed.' };
    return { allowed: best.r.allow, why: 'Group "' + used + '": the longest matching rule is "' + (best.r.allow ? 'Allow' : 'Disallow') + ': ' + best.r.path + '".' };
  }
  function runRobots() {
    var parsed = parseRobots($('#r-text').value);
    var p = $('#r-path').value.trim() || '/';
    try { if (/^https?:/i.test(p)) { var u = new URL(p); p = u.pathname + u.search; } } catch (e) {}
    if (p[0] !== '/') p = '/' + p;
    var res = test(parsed, $('#r-ua').value || '*', p);
    $('#r-verdict').innerHTML = '<strong style="color:var(--' + (res.allowed ? 'good' : 'bad') + ')">' + (res.allowed ? 'ALLOWED' : 'BLOCKED') + '</strong> ' + esc(p) + '\n' + esc(res.why);
    var rep = '<div class="table-wrap"><table><thead><tr><th>User agents</th><th>Rules</th></tr></thead><tbody>' +
      parsed.groups.map(function (g) {
        return '<tr><td>' + esc(g.agents.join(', ')) + '</td><td>' + (g.rules.length ? g.rules.map(function (r) { return (r.allow ? 'Allow: ' : 'Disallow: ') + esc(r.path); }).join('<br>') : 'Allow everything') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    var notes = parsed.issues.slice();
    var star = parsed.groups.filter(function (g) { return g.agents.indexOf('*') !== -1; })[0];
    if (star && star.rules.some(function (r) { return !r.allow && r.path === '/'; })) notes.unshift('The * group blocks the whole site. Search engines without their own group will not crawl it.');
    if (!parsed.sitemaps.length) notes.push('No Sitemap line. Adding one helps crawlers find your URLs.');
    else rep += '<p>Sitemaps listed: ' + parsed.sitemaps.map(function (s) { return '<code>' + esc(s) + '</code>'; }).join(', ') + '</p>';
    rep += notes.length ? '<ul>' + notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : '<p class="status ok">No problems found.</p>';
    $('#r-report').innerHTML = rep;
  }

  /* ---------- sitemap ---------- */
  var LASTMOD = /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?)?)?$/;
  function runSitemap() {
    var doc = new DOMParser().parseFromString($('#x-text').value, 'application/xml');
    var err = doc.getElementsByTagName('parsererror')[0];
    if (err) { $('#x-stats').innerHTML = ''; $('#x-report').innerHTML = '<p class="status err">The XML is not well formed: ' + esc(err.textContent.slice(0, 200)) + '</p>'; return; }
    var rootEl = doc.documentElement, isIndex = rootEl.localName === 'sitemapindex';
    var issues = [];
    if (rootEl.localName !== 'urlset' && !isIndex) issues.push('Root element is <' + rootEl.localName + '>; it should be <urlset> or <sitemapindex>.');
    if (rootEl.namespaceURI !== 'http://www.sitemaps.org/schemas/sitemap/0.9') issues.push('Missing or wrong namespace. Use xmlns="http://www.sitemaps.org/schemas/sitemap/0.9".');
    var entries = Array.prototype.slice.call(rootEl.children).filter(function (e) { return e.localName === (isIndex ? 'sitemap' : 'url'); });
    var seen = {}, dupes = 0, rel = 0, badDate = 0, hosts = {};
    entries.forEach(function (e, i) {
      var locEl = Array.prototype.slice.call(e.children).filter(function (c) { return c.localName === 'loc'; })[0];
      var loc = locEl ? locEl.textContent.trim() : '';
      if (!loc) { issues.push('Entry ' + (i + 1) + ' has no <loc>.'); return; }
      if (seen[loc]) { dupes++; if (dupes <= 5) issues.push('Duplicate URL: ' + loc); }
      seen[loc] = 1;
      if (!/^https?:\/\//.test(loc)) { rel++; if (rel <= 5) issues.push('Relative URL (must be absolute): ' + loc); }
      else { try { hosts[new URL(loc).host] = 1; } catch (x) {} }
      var lm = Array.prototype.slice.call(e.children).filter(function (c) { return c.localName === 'lastmod'; })[0];
      if (lm && !LASTMOD.test(lm.textContent.trim())) { badDate++; if (badDate <= 5) issues.push('Lastmod "' + lm.textContent.trim() + '" is not W3C date format (YYYY-MM-DD).'); }
    });
    if (entries.length > 50000) issues.push('More than 50,000 URLs. Split into several sitemaps with a sitemap index.');
    if (Object.keys(hosts).length > 1) issues.push('URLs span more than one host: ' + Object.keys(hosts).join(', ') + '.');
    var bytes = new Blob([$('#x-text').value]).size;
    if (bytes > 50 * 1048576) issues.push('File is larger than 50 MB uncompressed.');
    $('#x-stats').innerHTML = [[isIndex ? 'Sitemaps listed' : 'URLs', entries.length], ['Duplicates', dupes], ['Relative URLs', rel], ['Bad lastmod', badDate], ['Size', TB.formatBytes(bytes)]]
      .map(function (s) { return '<div class="stat"><b>' + s[1] + '</b><span>' + s[0] + '</span></div>'; }).join('');
    $('#x-report').innerHTML = issues.length ? '<ul>' + issues.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : '<p class="status ok">No problems found.</p>';
  }

  /* ---------- fetching (only works when the site allows cross-origin reads) ---------- */
  function grab(url, ta, after) {
    TB.status($('#r-status'), 'Fetching ' + url + ' ...');
    fetch(url, { mode: 'cors', credentials: 'omit' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (t) {
      ta.value = t; after();
      TB.status($('#r-status'), 'Fetched ' + url + '.', 'ok');
    }).catch(function () {
      TB.status($('#r-status'), 'Your browser could not read ' + url + '. Most sites block cross-site reads (CORS). Open the URL in a new tab, copy the text, and paste it above.', 'err');
    });
  }
  $('#r-fetch').addEventListener('click', function () {
    var s = $('#r-site').value.trim();
    if (!s) return TB.status($('#r-status'), 'Enter a site URL first.', 'err');
    if (!/^https?:\/\//.test(s)) s = 'https://' + s;
    try { grab(new URL('/robots.txt', s).toString(), $('#r-text'), runRobots); } catch (e) { TB.status($('#r-status'), 'That URL is not valid.', 'err'); }
  });
  $('#x-fetch').addEventListener('click', function () {
    var s = $('#x-url').value.trim();
    if (!s) return TB.status($('#r-status'), 'Enter a sitemap URL first.', 'err');
    grab(s, $('#x-text'), runSitemap);
  });
  $$('[data-tab]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-tab]').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      $('#r-robots').hidden = b.getAttribute('data-tab') !== 'robots';
      $('#r-sitemap').hidden = b.getAttribute('data-tab') !== 'sitemap';
      TB.status($('#r-status'), '');
    });
  });
  $('#r-robots').addEventListener('input', TB.debounce(runRobots, 150));
  $('#x-text').addEventListener('input', TB.debounce(runSitemap, 200));
  runRobots(); runSitemap();
})();
