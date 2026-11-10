(function () {
  'use strict';
  var $ = TB.$, $$ = TB.$$, esc = TB.esc;
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
  function trunc(s, n) { return s.length > n ? s.slice(0, n - 1).trim() + '...' : s; }
  function vals() {
    return { title: $('#o-title').value.trim(), desc: $('#o-desc').value.trim(), image: $('#o-image').value.trim(),
      url: $('#o-url').value.trim(), site: $('#o-site').value.trim(), card: $('#o-card').value };
  }
  function check(ok, warn, msg) { return '<div><span class="pill ' + (ok ? 'good' : (warn ? 'warn' : 'bad')) + '">' + (ok ? 'OK' : (warn ? 'Check' : 'Fix')) + '</span> ' + msg + '</div>'; }
  function render() {
    var v = vals();
    ['#o-large', '#o-small'].forEach(function (id) {
      var c = $(id);
      var img = $('.og-img', c);
      img.style.backgroundImage = v.image ? 'url("' + v.image.replace(/"/g, '%22') + '")' : '';
      img.textContent = v.image ? '' : 'No image';
      $('.og-host', c).textContent = host(v.url) || v.site;
      $('.og-title', c).textContent = trunc(v.title || '(no og:title)', id === '#o-large' ? 90 : 70);
      $('.og-desc', c).textContent = trunc(v.desc, id === '#o-large' ? 160 : 100);
    });
    var out = [];
    out.push(check(v.title && v.title.length <= 70, v.title.length > 70, 'Title is ' + v.title.length + ' characters. Under about 70 avoids cut-offs on most platforms.'));
    out.push(check(v.desc && v.desc.length >= 50 && v.desc.length <= 200, !!v.desc, 'Description is ' + v.desc.length + ' characters. Aim for roughly 50 to 200.'));
    out.push(check(/^https?:\/\//.test(v.image), false, v.image ? 'Image URL must be absolute (start with https://).' : 'Add og:image. Links without an image get much smaller cards.'));
    if (/^https?:\/\//.test(v.image)) out[out.length - 1] = check(true, false, 'Image URL is absolute. Use 1200 x 630 pixels (1.91:1) for large cards.');
    out.push(check(/^https?:\/\//.test(v.url), false, 'og:url should be the absolute canonical URL of the page.'));
    $('#o-checks').innerHTML = out.join('');
    if (v.image) {
      var im = new Image();
      im.onload = function () {
        var ratio = im.naturalWidth / im.naturalHeight;
        $('#o-checks').insertAdjacentHTML('beforeend', check(im.naturalWidth >= 1200 && Math.abs(ratio - 1.91) < 0.1, im.naturalWidth >= 600,
          'Image loads at ' + im.naturalWidth + ' x ' + im.naturalHeight + ' pixels.'));
      };
      im.onerror = function () { $('#o-checks').insertAdjacentHTML('beforeend', check(false, true, 'The image did not load in your browser. Check the URL is public.')); };
      im.src = v.image;
    }
    var code = [
      '<meta property="og:type" content="website">',
      '<meta property="og:title" content="' + esc(v.title) + '">',
      '<meta property="og:description" content="' + esc(v.desc) + '">',
      v.url ? '<meta property="og:url" content="' + esc(v.url) + '">' : '',
      v.image ? '<meta property="og:image" content="' + esc(v.image) + '">' : '',
      v.site ? '<meta property="og:site_name" content="' + esc(v.site) + '">' : '',
      '<meta name="twitter:card" content="' + v.card + '">'
    ].filter(Boolean).join('\n');
    $('#o-code').textContent = code;
  }
  function parse() {
    var doc = new DOMParser().parseFromString($('#o-src').value, 'text/html');
    function m(names) {
      for (var i = 0; i < names.length; i++) {
        var el = doc.querySelector('meta[property="' + names[i] + '"], meta[name="' + names[i] + '"]');
        if (el && el.getAttribute('content')) return el.getAttribute('content');
      }
      return '';
    }
    $('#o-title').value = m(['og:title', 'twitter:title']) || (doc.querySelector('title') || {}).textContent || '';
    $('#o-desc').value = m(['og:description', 'twitter:description', 'description']);
    $('#o-image').value = m(['og:image', 'og:image:url', 'twitter:image']);
    var canon = doc.querySelector('link[rel=canonical]');
    $('#o-url').value = m(['og:url']) || (canon ? canon.getAttribute('href') : '');
    $('#o-site').value = m(['og:site_name']);
    var card = m(['twitter:card']);
    if (card) $('#o-card').value = card === 'summary' ? 'summary' : 'summary_large_image';
    render();
  }
  $$('[data-mode]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-mode]').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      $('#o-html').hidden = b.getAttribute('data-mode') !== 'html';
    });
  });
  $('#o-parse').addEventListener('click', parse);
  $('#o-fields').addEventListener('input', TB.debounce(render, 200));
  $('#o-card').addEventListener('change', render);
  $('#o-copy').addEventListener('click', function () { TB.copy($('#o-code').textContent, this); });
  render();
})();
