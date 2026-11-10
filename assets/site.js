/* Toolbench shared behavior + small helpers used by every tool. No dependencies. */
(function () {
  'use strict';
  var CFG = window.SITE_CONFIG || {};
  var root = document.documentElement;

  /* ---------- theme ---------- */
  try {
    var saved = localStorage.getItem('tb-theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) {}
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.querySelector('.theme-btn');
    if (b) {
      var label = function () { b.textContent = currentTheme() === 'dark' ? 'Light mode' : 'Dark mode'; };
      label();
      b.addEventListener('click', function () {
        var next = currentTheme() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('tb-theme', next); } catch (e) {}
        label();
      });
    }
    renderAds();
    renderContactForm();
    initIndexSearch();
  });

  /* ---------- ads (render nothing until configured) ---------- */
  function renderAds() {
    var client = CFG.ADSENSE_CLIENT;
    var slots = CFG.AD_SLOTS || {};
    if (!client) return;
    var used = 0;
    document.querySelectorAll('.ad-slot[data-slot]').forEach(function (el) {
      var id = slots[el.getAttribute('data-slot')];
      if (!id) return;
      used++;
      el.innerHTML = '<span class="ad-label">Advertisement</span><ins class="adsbygoogle" style="display:block" data-ad-client="' +
        client + '" data-ad-slot="' + id + '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
    });
    if (!used) return;
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client);
    document.head.appendChild(s);
    document.querySelectorAll('.adsbygoogle').forEach(function () {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  }

  /* ---------- contact form ---------- */
  function renderContactForm() {
    var slot = document.getElementById('contact-form');
    if (!slot || !CFG.HUBSPOT_CONTACT_FORM) return;
    var s = document.createElement('script');
    s.src = 'https://js.hsforms.net/forms/embed/v2.js';
    s.async = true;
    s.onload = function () {
      slot.innerHTML = '';
      window.hbspt.forms.create({ region: CFG.HUBSPOT_REGION, portalId: CFG.HUBSPOT_PORTAL, formId: CFG.HUBSPOT_CONTACT_FORM, target: '#contact-form' });
    };
    document.body.appendChild(s);
  }

  /* ---------- index search ---------- */
  function initIndexSearch() {
    var input = document.getElementById('tool-search');
    if (!input) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search]'));
    var cats = Array.prototype.slice.call(document.querySelectorAll('.cat'));
    var none = document.getElementById('no-results');
    function run() {
      var q = input.value.trim().toLowerCase();
      var terms = q.split(/\s+/).filter(Boolean);
      var shown = 0;
      cards.forEach(function (c) {
        var hay = c.getAttribute('data-search');
        var ok = terms.every(function (t) { return hay.indexOf(t) !== -1; });
        c.hidden = !ok;
        if (ok) shown++;
      });
      cats.forEach(function (cat) { cat.hidden = !cat.querySelector('[data-search]:not([hidden])'); });
      if (none) none.hidden = shown !== 0;
    }
    input.addEventListener('input', run);
    var qs = new URLSearchParams(location.search).get('q');
    if (qs) { input.value = qs; }
    run();
  }

  /* ---------- helpers for tools ---------- */
  var TB = {};
  TB.$ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  TB.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  TB.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  TB.copy = function (text, btn) {
    function done() {
      if (!btn) return;
      var old = btn.getAttribute('data-label') || btn.textContent;
      btn.setAttribute('data-label', old);
      btn.textContent = 'Copied';
      setTimeout(function () { btn.textContent = old; }, 1200);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    } else { fallback(); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta); done();
    }
  };
  TB.download = function (name, data, type) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: type || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  TB.debounce = function (fn, ms) {
    var t; return function () { var a = arguments, me = this; clearTimeout(t); t = setTimeout(function () { fn.apply(me, a); }, ms || 150); };
  };
  TB.status = function (el, msg, kind) {
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'status' + (kind ? ' ' + kind : '');
  };
  TB.readFile = function (file, cb) {
    var r = new FileReader();
    r.onload = function () { cb(String(r.result)); };
    r.readAsText(file);
  };
  /* Wire a <input type=file> so loading a file drops its text into a textarea. */
  TB.fileToTextarea = function (input, ta, after) {
    if (!input) return;
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      if (!f) return;
      TB.readFile(f, function (txt) { ta.value = txt; if (after) after(f); ta.dispatchEvent(new Event('input')); });
    });
  };

  /* CSV: RFC 4180 style parser. Handles quotes, escaped quotes, CRLF, and embedded newlines. */
  TB.detectDelimiter = function (text) {
    var sample = text.split(/\r?\n/).slice(0, 10).join('\n');
    var best = ',', bestScore = -1;
    [',', ';', '\t', '|'].forEach(function (d) {
      var rows = TB.parseCSV(sample, d).filter(function (r) { return r.length > 1; });
      if (!rows.length) return;
      var counts = rows.map(function (r) { return r.length; });
      var same = counts.filter(function (c) { return c === counts[0]; }).length;
      var score = same * counts[0];
      if (score > bestScore) { bestScore = score; best = d; }
    });
    return best;
  };
  TB.parseCSV = function (text, delim) {
    delim = delim || ',';
    var rows = [], row = [], field = '', i = 0, inQ = false, n = text.length;
    if (text.charCodeAt(0) === 0xFEFF) i = 1;
    for (; i < n; i++) {
      var c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else { inQ = false; }
        } else { field += c; }
      } else if (c === '"' && field === '') {
        inQ = true;
      } else if (c === delim) {
        row.push(field); field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); rows.push(row); row = []; field = '';
      } else { field += c; }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  };
  TB.toCSV = function (rows, delim) {
    delim = delim || ',';
    return rows.map(function (r) {
      return r.map(function (v) {
        v = v == null ? '' : String(v);
        if (v.indexOf('"') !== -1 || v.indexOf(delim) !== -1 || /[\r\n]/.test(v) || /^\s|\s$/.test(v)) {
          return '"' + v.replace(/"/g, '""') + '"';
        }
        return v;
      }).join(delim);
    }).join('\r\n');
  };
  TB.formatBytes = function (b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  };
  window.TB = TB;
})();
