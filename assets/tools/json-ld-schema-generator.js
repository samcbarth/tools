(function () {
  'use strict';
  var $ = TB.$, $$ = TB.$$, esc = TB.esc;
  /* field: [key, label, kind, placeholder, required] */
  var FORMS = {
    LocalBusiness: [
      ['subtype', 'Business type', 'select:LocalBusiness,Restaurant,Store,ProfessionalService,HomeAndConstructionBusiness,MedicalBusiness,LegalService,AutomotiveBusiness,RealEstateAgent,FinancialService'],
      ['name', 'Business name', 'text', 'Acme Plumbing', 1],
      ['url', 'Website', 'url', 'https://acmeplumbing.com'],
      ['telephone', 'Phone', 'text', '+1-405-555-0100'],
      ['image', 'Logo or photo URL', 'url', 'https://acmeplumbing.com/logo.png'],
      ['street', 'Street address', 'text', '100 Main St'],
      ['city', 'City', 'text', 'Oklahoma City'],
      ['region', 'State or region', 'text', 'OK'],
      ['postal', 'Postal code', 'text', '73102'],
      ['country', 'Country code', 'text', 'US'],
      ['hours', 'Opening hours', 'text', 'Mo-Fr 08:00-17:00, Sa 09:00-12:00'],
      ['price', 'Price range', 'text', '$$'],
      ['sameAs', 'Profile URLs (one per line)', 'area', 'https://www.facebook.com/acme\nhttps://www.linkedin.com/company/acme']
    ],
    Article: [
      ['subtype', 'Article type', 'select:Article,BlogPosting,NewsArticle'],
      ['headline', 'Headline', 'text', 'How to build UTM links', 1],
      ['description', 'Description', 'text', 'A short summary of the article'],
      ['url', 'Article URL', 'url', 'https://example.com/blog/utm-links'],
      ['image', 'Image URL', 'url', 'https://example.com/img/utm.png'],
      ['author', 'Author name', 'text', 'Jane Doe', 1],
      ['authorUrl', 'Author profile URL', 'url', 'https://example.com/about/jane'],
      ['publisher', 'Publisher name', 'text', 'Example Co'],
      ['logo', 'Publisher logo URL', 'url', 'https://example.com/logo.png'],
      ['published', 'Date published', 'date', ''],
      ['modified', 'Date modified', 'date', '']
    ],
    Product: [
      ['name', 'Product name', 'text', 'Trail Running Shoe', 1],
      ['description', 'Description', 'text', 'Lightweight shoe for rocky trails'],
      ['image', 'Image URL', 'url', 'https://example.com/shoe.jpg'],
      ['brand', 'Brand', 'text', 'Example Brand'],
      ['sku', 'SKU', 'text', 'TRS-001'],
      ['gtin', 'GTIN / UPC (optional)', 'text', ''],
      ['url', 'Product page URL', 'url', 'https://example.com/shoe'],
      ['price', 'Price', 'number', '129.99'],
      ['currency', 'Currency', 'text', 'USD'],
      ['availability', 'Availability', 'select:InStock,OutOfStock,PreOrder,BackOrder,Discontinued'],
      ['condition', 'Condition', 'select:NewCondition,UsedCondition,RefurbishedCondition'],
      ['rating', 'Average rating (only if real reviews are shown on the page)', 'number', ''],
      ['ratingCount', 'Number of reviews', 'number', '']
    ]
  };
  var type = 'LocalBusiness';
  function draw() {
    $('#s-form').innerHTML = '<div class="row">' + FORMS[type].map(function (f) {
      var id = 's-' + f[0], lab = '<label for="' + id + '">' + esc(f[1]) + (f[4] ? ' <span class="hint">required</span>' : '') + '</label>';
      if (f[2].indexOf('select:') === 0) {
        return '<div>' + lab + '<select id="' + id + '">' + f[2].slice(7).split(',').map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select></div>';
      }
      if (f[2] === 'area') return '<div>' + lab + '<textarea id="' + id + '" style="min-height:70px" placeholder="' + esc(f[3]) + '"></textarea></div>';
      return '<div>' + lab + '<input id="' + id + '" type="' + f[2] + '" placeholder="' + esc(f[3] || '') + '"' + (f[2] === 'number' ? ' step="any"' : '') + '></div>';
    }).join('') + '</div>';
    gen();
  }
  function v(k) { var el = $('#s-' + k); return el ? el.value.trim() : ''; }
  function prune(o) {
    Object.keys(o).forEach(function (k) {
      var x = o[k];
      if (x && typeof x === 'object' && !Array.isArray(x)) { prune(x); if (Object.keys(x).filter(function (y) { return y !== '@type'; }).length === 0) delete o[k]; }
      else if (x === '' || x == null || (Array.isArray(x) && !x.length)) delete o[k];
    });
    return o;
  }
  function gen() {
    var d, missing = [];
    FORMS[type].forEach(function (f) { if (f[4] && !v(f[0])) missing.push(f[1]); });
    if (type === 'LocalBusiness') {
      d = { '@context': 'https://schema.org', '@type': v('subtype'), name: v('name'), url: v('url'), telephone: v('telephone'), image: v('image'), priceRange: v('price'),
        address: { '@type': 'PostalAddress', streetAddress: v('street'), addressLocality: v('city'), addressRegion: v('region'), postalCode: v('postal'), addressCountry: v('country') },
        openingHours: v('hours') ? v('hours').split(/\s*,\s*/) : [],
        sameAs: v('sameAs').split(/\s+/).filter(Boolean) };
    } else if (type === 'Article') {
      d = { '@context': 'https://schema.org', '@type': v('subtype'), headline: v('headline'), description: v('description'), image: v('image') ? [v('image')] : [],
        mainEntityOfPage: v('url'), datePublished: v('published'), dateModified: v('modified') || v('published'),
        author: { '@type': 'Person', name: v('author'), url: v('authorUrl') },
        publisher: { '@type': 'Organization', name: v('publisher'), logo: { '@type': 'ImageObject', url: v('logo') } } };
      if (v('headline').length > 110) missing.push('a headline under 110 characters');
    } else {
      d = { '@context': 'https://schema.org', '@type': 'Product', name: v('name'), description: v('description'), image: v('image') ? [v('image')] : [], sku: v('sku'), gtin: v('gtin'),
        brand: { '@type': 'Brand', name: v('brand') },
        offers: { '@type': 'Offer', url: v('url'), price: v('price'), priceCurrency: v('currency'),
          availability: 'https://schema.org/' + v('availability'), itemCondition: 'https://schema.org/' + v('condition') } };
      if (v('rating') && v('ratingCount')) d.aggregateRating = { '@type': 'AggregateRating', ratingValue: v('rating'), reviewCount: v('ratingCount') };
      if (!v('price')) delete d.offers.availability, delete d.offers.itemCondition;
    }
    prune(d);
    var json = JSON.stringify(d, null, 2).replace(/<\//g, '<\\/');
    $('#s-out').textContent = '<script type="application/ld+json">\n' + json + '\n</script>';
    TB.status($('#s-status'), missing.length ? 'Still needed: ' + missing.join(', ') + '.' : 'Valid JSON. Test it in Google\'s Rich Results Test after publishing.', missing.length ? 'err' : 'ok');
  }
  $$('[data-type]').forEach(function (b) {
    b.addEventListener('click', function () {
      type = b.getAttribute('data-type');
      $$('[data-type]').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      draw();
    });
  });
  $('#s-form').addEventListener('input', gen);
  $('#s-form').addEventListener('change', gen);
  $('#s-copy').addEventListener('click', function () { TB.copy($('#s-out').textContent, this); });
  draw();
})();
