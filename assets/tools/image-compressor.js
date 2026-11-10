(function () {
  'use strict';
  var $ = TB.$, esc = TB.esc;
  var files = [], results = [];
  var EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

  function load(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { res({ img: img, url: url }); };
      img.onerror = function () { rej(new Error('Could not read ' + file.name)); };
      img.src = url;
    });
  }
  function encode(img, type, q, maxW) {
    var w = img.naturalWidth, h = img.naturalHeight;
    if (maxW > 0 && w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    if (type === 'image/jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    return new Promise(function (res) { c.toBlob(function (b) { res({ blob: b, w: w, h: h }); }, type, q / 100); });
  }
  function process() {
    if (!files.length) return;
    var type = $('#i-fmt').value, q = +$('#i-q').value, maxW = parseInt($('#i-w').value, 10) || 0;
    TB.status($('#i-status'), 'Compressing ' + files.length + ' image' + (files.length > 1 ? 's' : '') + '...');
    results = [];
    var list = $('#i-list');
    list.innerHTML = '';
    var chain = Promise.resolve(), saved = 0, before = 0;
    files.forEach(function (f, i) {
      chain = chain.then(function () { return load(f); }).then(function (r) {
        return encode(r.img, type, q, maxW).then(function (e) {
          if (!e.blob) throw new Error('This browser cannot encode ' + type);
          var name = f.name.replace(/\.\w+$/, '') + '.' + EXT[type];
          results.push({ name: name, blob: e.blob });
          before += f.size; saved += f.size - e.blob.size;
          var pct = Math.round((1 - e.blob.size / f.size) * 100);
          var out = URL.createObjectURL(e.blob);
          list.insertAdjacentHTML('beforeend', '<div class="img-compare" style="margin-bottom:12px">' +
            '<figure><img src="' + r.url + '" alt="Original ' + esc(f.name) + '" loading="lazy"><figcaption>Original: ' + esc(f.name) + ', ' + r.img.naturalWidth + ' x ' + r.img.naturalHeight + ', ' + TB.formatBytes(f.size) + '</figcaption></figure>' +
            '<figure><img src="' + out + '" alt="Compressed ' + esc(name) + '" loading="lazy"><figcaption>' + esc(name) + ', ' + e.w + ' x ' + e.h + ', ' + TB.formatBytes(e.blob.size) +
            ' <span class="pill ' + (pct > 0 ? 'good' : 'bad') + '">' + (pct > 0 ? pct + '% smaller' : Math.abs(pct) + '% larger') + '</span> <button class="btn secondary" type="button" data-i="' + (results.length - 1) + '">Download</button></figcaption></figure></div>');
        });
      }).catch(function (err) { list.insertAdjacentHTML('beforeend', '<p class="status err">' + esc(err.message) + '</p>'); });
    });
    chain.then(function () {
      $('#i-all').disabled = !results.length;
      TB.status($('#i-status'), results.length ? 'Done. Saved ' + TB.formatBytes(Math.max(0, saved)) + ' of ' + TB.formatBytes(before) + '. If a file got larger, lower the quality or keep the original.' : '', 'ok');
    });
  }
  function take(list) {
    files = Array.prototype.filter.call(list, function (f) { return /^image\//.test(f.type); });
    if (!files.length) return TB.status($('#i-status'), 'Choose image files (JPG, PNG, WebP or GIF).', 'err');
    process();
  }
  $('#i-file').addEventListener('change', function () { take(this.files); });
  var drop = $('#i-drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { take(e.dataTransfer.files); });
  $('#i-q').addEventListener('input', function () { $('#i-qv').textContent = this.value; });
  $('#i-q').addEventListener('change', process);
  $('#i-fmt').addEventListener('change', function () { $('#i-q').disabled = this.value === 'image/png'; process(); });
  $('#i-w').addEventListener('change', process);
  $('#i-list').addEventListener('click', function (e) {
    var b = e.target.closest('[data-i]');
    if (b) { var r = results[+b.getAttribute('data-i')]; TB.download(r.name, r.blob); }
  });
  $('#i-all').addEventListener('click', function () {
    results.forEach(function (r, i) { setTimeout(function () { TB.download(r.name, r.blob); }, i * 300); });
  });
  window.__imgTool = { take: take };
})();
