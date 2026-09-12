// Выбор региона в футере (P163). Регион — не язык: Asia живёт на uniqore.kz,
// остальные — на uniqore.ai. Выбор запоминается и меняется; автопереброса
// при заходе нет — человек, набравший адрес сам, хочет именно его.
// Переход — на ту же страницу другого домена по hreflang текущей страницы,
// иначе на главную. Один скрипт на оба домена: подписи — в разметке.
(function () {
  var SITE_OF = { us: 'ai', eu: 'ai', au: 'ai', asia: 'kz', other: 'ai' };
  var KEY = 'uniqore-region';
  var here = location.hostname.indexOf('uniqore.kz') === 0 ? 'kz' : 'ai';
  var menus = document.querySelectorAll('.region-menu');
  if (!menus.length) return;

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function show(region) {
    menus.forEach(function (menu) {
      var current = menu.querySelector('.region-current');
      var chosen = null;
      menu.querySelectorAll('[data-region]').forEach(function (btn) {
        var on = btn.getAttribute('data-region') === region;
        if (on) chosen = btn;
        if (on) btn.setAttribute('aria-current', 'true'); else btn.removeAttribute('aria-current');
      });
      if (current && chosen) current.textContent = chosen.textContent.trim();
    });
  }
  function alternate(site) {
    var lang = site === 'kz' ? 'ru' : 'en';
    var link = document.querySelector('link[rel="alternate"][hreflang="' + lang + '"]');
    return link && link.href ? link.href : 'https://uniqore.' + site + '/';
  }
  menus.forEach(function (menu) {
    menu.querySelectorAll('[data-region]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var region = btn.getAttribute('data-region');
        try { localStorage.setItem(KEY, region); } catch (e) {}
        show(region);
        menu.removeAttribute('open');
        var target = SITE_OF[region] || 'ai';
        if (target !== here) location.href = alternate(target);
      });
    });
  });
  document.addEventListener('click', function (e) {
    menus.forEach(function (menu) { if (menu.hasAttribute('open') && !menu.contains(e.target)) menu.removeAttribute('open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') menus.forEach(function (menu) { menu.removeAttribute('open'); });
  });
  var initial = saved();
  if (initial && SITE_OF[initial]) show(initial);
})();
