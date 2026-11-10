(function () {
  'use strict';
  var $ = TB.$, $$ = TB.$$;
  /* Short common English words for passphrases (no offensive words). 256 words = 8 bits each. */
  var WORDS = ('able acid aged also area army away baby back ball band bank base bath bear beat bell belt best bike bird blue boat body bone book boot born boss both bowl bulk burn bush busy cake calm camp card care cart case cash cast cell chef chip city clay club coal coat code cold cook cool copy corn cost crew crop cube cure dark data date dawn deal deck deep deer desk dial diet dish dock door dose down draw drum duck dust duty each east easy edge even exam exit face fact fair farm fast fern file film fire firm fish flag flat flow fold food foot fork form fort four free frog fuel full gain game gate gear gift girl glad glow goal gold golf good gown grab gray grid grow gulf hair half hall hand harp hawk head heat herb hero hill hint hold home hood hook hope horn hose host hour huge idea inch iron item jade jazz join joke jump jury keen kept king kite knee knot lake lamp land lane last lawn leaf lens lift lime line lion list loaf lock loft long loop lord luck lung mail main malt mane maple mask meal melt menu mild milk mill mind mint mist mode mood moon moss most moth move much mule nail name navy neck nest news next nice noon nose note oak oath ocean olive open oven owl pace pack page palm park path peak pear pine pink plan plum poem pond pool port post pure quiz race rain ramp rare reed rice ring road rock roof room rope rose ruby rule safe sail salt sand seal seed ship shoe silk sing site snow soap sock soft soil song sort soup star stem step stew tail tank team tent tide tile time toad tool town tree trip tune twig unit vase vest view vine vote wade wall wave west wheat whip wild wind wing wire wolf wood wool yard yarn year zero zinc zone').split(' ');
  var SETS = { upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower: 'abcdefghijklmnopqrstuvwxyz', digits: '0123456789', symbols: '!@#$%^&*()-_=+[]{};:,.?/' };
  var mode = 'chars';
  function rand(n) {
    /* Unbiased random integer in [0, n) from the Web Crypto API. */
    var max = Math.floor(0x100000000 / n) * n, buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= max);
    return buf[0] % n;
  }
  function chars() {
    var len = +$('#p-len').value, pools = [];
    Object.keys(SETS).forEach(function (k) {
      if (!$('#p-' + k).checked) return;
      var s = SETS[k];
      if ($('#p-similar').checked) s = s.replace(/[0Ol1I|]/g, '');
      pools.push(s);
    });
    if (!pools.length) return { pw: '', bits: 0 };
    var all = pools.join(''), out = pools.map(function (p) { return p[rand(p.length)]; });
    while (out.length < len) out.push(all[rand(all.length)]);
    for (var i = out.length - 1; i > 0; i--) { var j = rand(i + 1), t = out[i]; out[i] = out[j]; out[j] = t; }
    return { pw: out.join(''), bits: len * Math.log2(all.length) };
  }
  function words() {
    var n = Math.max(3, Math.min(12, parseInt($('#p-wc').value, 10) || 5)), w = [];
    for (var i = 0; i < n; i++) w.push(WORDS[rand(WORDS.length)]);
    var bits = n * Math.log2(WORDS.length);
    if ($('#p-cap').checked) { w = w.map(function (x) { return x[0].toUpperCase() + x.slice(1); }); w.push(String(rand(100))); bits += Math.log2(100); }
    return { pw: w.join($('#p-sep').value), bits: bits };
  }
  function gen() {
    var r = mode === 'chars' ? chars() : words();
    $('#p-out').textContent = r.pw || 'Pick at least one character set.';
    var b = Math.round(r.bits), label = b < 50 ? 'Weak' : b < 70 ? 'Fair' : b < 100 ? 'Strong' : 'Very strong';
    $('#p-bar').style.width = Math.min(100, b / 128 * 100) + '%';
    $('#p-bar').className = b < 50 ? 'bad' : b < 70 ? 'warn' : '';
    TB.status($('#p-strength'), label + ': about ' + b + ' bits of entropy.', b < 50 ? 'err' : 'ok');
  }
  $$('[data-p]').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.getAttribute('data-p');
      $$('[data-p]').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      $('#p-chars').hidden = mode !== 'chars'; $('#p-words').hidden = mode !== 'words';
      gen();
    });
  });
  $('#p-len').addEventListener('input', function () { $('#p-lenv').textContent = this.value; gen(); });
  document.getElementById('tool').addEventListener('change', gen);
  $('#p-gen').addEventListener('click', gen);
  $('#p-copy').addEventListener('click', function () { TB.copy($('#p-out').textContent, this); });
  gen();
})();
