(function () {
  'use strict';
  var $ = TB.$, $$ = TB.$$;
  var SMALL = /^(a|an|and|as|at|but|by|for|in|nor|of|on|or|per|the|to|vs|via|with|up|from|into|over)$/i;
  function wordsOf(s) {
    return s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_\-]+/g, ' ').split(/[^\p{L}\p{N}']+/u).filter(Boolean);
  }
  function cap(w) { return w.charAt(0).toUpperCase() + w.slice(1); }
  var CASES = {
    upper: function (s) { return s.toUpperCase(); },
    lower: function (s) { return s.toLowerCase(); },
    title: function (s) {
      return s.split('\n').map(function (line) {
        var parts = line.toLowerCase().split(/(\s+)/), idx = parts.map(function (p, i) { return /\S/.test(p) ? i : -1; }).filter(function (i) { return i >= 0; });
        return parts.map(function (p, i) {
          if (!/\S/.test(p)) return p;
          var first = i === idx[0], lastW = i === idx[idx.length - 1];
          var bare = p.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
          if (!first && !lastW && SMALL.test(bare)) return p;
          return p.replace(/[\p{L}\p{N}]/u, function (c) { return c.toUpperCase(); }).replace(/-(\p{L})/gu, function (m, c) { return '-' + c.toUpperCase(); });
        }).join('');
      }).join('\n');
    },
    sentence: function (s) {
      return s.toLowerCase().replace(/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu, function (m, a, b) { return a + b.toUpperCase(); }).replace(/\bi\b/g, 'I');
    },
    camel: function (s) { var w = wordsOf(s).map(function (x) { return x.toLowerCase(); }); return w.map(function (x, i) { return i ? cap(x) : x; }).join(''); },
    pascal: function (s) { return wordsOf(s).map(function (x) { return cap(x.toLowerCase()); }).join(''); },
    snake: function (s) { return wordsOf(s).map(function (x) { return x.toLowerCase(); }).join('_'); },
    kebab: function (s) { return wordsOf(s).map(function (x) { return x.toLowerCase(); }).join('-'); },
    constant: function (s) { return wordsOf(s).map(function (x) { return x.toUpperCase(); }).join('_'); },
    alternate: function (s) { var i = 0; return s.replace(/\p{L}/gu, function (c) { return i++ % 2 ? c.toUpperCase() : c.toLowerCase(); }); }
  };
  window.convertCase = function (s, kind) { return CASES[kind](s); };
  var current = 'title';
  function run() {
    $('#v-out').value = CASES[current]($('#v-in').value);
    $$('[data-case]').forEach(function (b) { b.className = 'btn ' + (b.getAttribute('data-case') === current ? '' : 'secondary'); });
  }
  $$('[data-case]').forEach(function (b) { b.addEventListener('click', function () { current = b.getAttribute('data-case'); run(); }); });
  $('#v-in').addEventListener('input', run);
  $('#v-copy').addEventListener('click', function () { TB.copy($('#v-out').value, this); });
  run();
})();
