(function () {
  'use strict';
  var $ = TB.$, $$ = TB.$$;
  /* Source: hubspot.com/pricing/marketing, /pricing/sales, /pricing/service, annual billing view, USD.
     Last checked 2026-11-09. Update CHECKED and these numbers together. */
  var CHECKED = 'November 9, 2026';
  var P = {
    starter: { starter: { seat: 7, list: 20, onb: 0 } },
    marketing: {
      pro: { base: 800, included: 3, extra: 45, onb: 3000 },
      ent: { base: 3600, included: 5, extra: 75, onb: 7000 }
    },
    sales: { pro: { seat: 90, onb: 1500 }, ent: { seat: 150, onb: 3500 } },
    service: { pro: { seat: 90, onb: 1500 }, ent: { seat: 150, onb: 3500 } }
  };
  var money = function (n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); };

  function defaults(row) {
    var p = row.getAttribute('data-p');
    var tier = $('.h-tier', row).value;
    var price = $('.h-price', row);
    var d = P[p][tier];
    price.disabled = tier === 'none';
    $('.h-seats', row).disabled = tier === 'none';
    if (!d) { price.value = ''; if ($('.h-extra', row)) $('.h-extra', row).textContent = ''; return; }
    if (p === 'starter') price.value = $('#h-list').checked ? d.list : d.seat;
    else if (p === 'marketing') {
      price.value = d.base;
      $('.h-extra', row).textContent = 'includes ' + d.included + ' core seats, extra seats ' + money(d.extra) + '/mo each';
    } else price.value = d.seat;
  }

  function calc() {
    var monthly = 0, onb = 0, seatsTotal = 0, notes = [];
    $$('#h-table tbody tr').forEach(function (row) {
      var p = row.getAttribute('data-p');
      var tier = $('.h-tier', row).value;
      var seats = Math.max(0, parseInt($('.h-seats', row).value, 10) || 0);
      var price = parseFloat($('.h-price', row).value) || 0;
      var sub = 0;
      var d = P[p][tier];
      if (d) {
        if (p === 'marketing') {
          var extra = Math.max(0, seats - d.included);
          sub = price + extra * d.extra;
          seatsTotal += Math.max(seats, d.included);
        } else {
          sub = seats * price;
          seatsTotal += seats;
        }
        onb += d.onb || 0;
      }
      monthly += sub;
      $('.h-sub', row).textContent = d ? money(sub) : '-';
    });
    if (!$('#h-onb').checked) onb = 0;
    var annual = monthly * 12;
    $('#h-stats').innerHTML = [
      ['Per month', money(monthly)], ['Per year', money(annual)],
      ['One-time onboarding', money(onb)], ['First year total', money(annual + onb)],
      ['Average per seat per month', seatsTotal ? money(Math.round(monthly / seatsTotal * 100) / 100) : '-']
    ].map(function (s) { return '<div class="stat"><b>' + s[1] + '</b><span>' + s[0] + '</span></div>'; }).join('');
    notes.push('Prices last checked ' + CHECKED + ' on hubspot.com/pricing. HubSpot Credits, extra marketing contacts, add-ons and taxes are not included.');
    var startRow = $('tr[data-p=starter]');
    if ($('.h-tier', startRow).value === 'starter' && !$('#h-list').checked) notes.push('The $7 Starter price is a limited-time offer for new customers.');
    TB.status($('#h-notes'), notes.join(' '));
  }
  $$('#h-table tbody tr').forEach(function (row) {
    defaults(row);
    $('.h-tier', row).addEventListener('change', function () { defaults(row); calc(); });
  });
  $('#h-list').addEventListener('change', function () { defaults($('tr[data-p=starter]')); calc(); });
  document.getElementById('tool').addEventListener('input', calc);
  $('#h-onb').addEventListener('change', calc);
  calc();
})();
